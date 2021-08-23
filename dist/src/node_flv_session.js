//
//  Created by Mingliang Chen on 17/8/4.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var URL = require('url');
var Logger = require('./node_core_logger');
var context = require('./node_core_ctx');
var NodeCoreUtils = require('./node_core_utils');
var FlvPacket = {
    create: function (payload, type, time) {
        if (payload === void 0) { payload = null; }
        if (type === void 0) { type = 0; }
        if (time === void 0) { time = 0; }
        return {
            header: {
                length: payload ? payload.length : 0,
                timestamp: time,
                type: type
            },
            payload: payload
        };
    }
};
var NodeFlvSession = /** @class */ (function () {
    function NodeFlvSession(config, req, res) {
        this.config = config;
        this.req = req;
        this.res = res;
        this.id = NodeCoreUtils.generateNewSessionID();
        this.ip = this.req.socket.remoteAddress;
        this.playStreamPath = '';
        this.playArgs = null;
        this.isStarting = false;
        this.isPlaying = false;
        this.isIdling = false;
        if (this.req.nmsConnectionType === 'ws') {
            this.res.cork = this.res._socket.cork.bind(this.res._socket);
            this.res.uncork = this.res._socket.uncork.bind(this.res._socket);
            this.res.on('close', this.onReqClose.bind(this));
            this.res.on('error', this.onReqError.bind(this));
            this.res.write = this.res.send;
            this.res.end = this.res.close;
            this.TAG = 'websocket-flv';
        }
        else {
            this.res.cork = this.res.socket.cork.bind(this.res.socket);
            this.res.uncork = this.res.socket.uncork.bind(this.res.socket);
            this.req.socket.on('close', this.onReqClose.bind(this));
            this.req.on('error', this.onReqError.bind(this));
            this.TAG = 'http-flv';
        }
        this.numPlayCache = 0;
        context.sessions.set(this.id, this);
    }
    NodeFlvSession.prototype.run = function () {
        var method = this.req.method;
        var urlInfo = URL.parse(this.req.url, true);
        var streamPath = urlInfo.pathname.split('.')[0];
        this.connectCmdObj = { ip: this.ip, method: method, streamPath: streamPath, query: urlInfo.query };
        this.connectTime = new Date();
        this.isStarting = true;
        Logger.log("[" + this.TAG + " connect] id=" + this.id + " ip=" + this.ip + " args=" + JSON.stringify(urlInfo.query));
        context.nodeEvent.emit('preConnect', this.id, this.connectCmdObj);
        if (!this.isStarting) {
            this.stop();
            return;
        }
        context.nodeEvent.emit('postConnect', this.id, this.connectCmdObj);
        if (method === 'GET') {
            this.playStreamPath = streamPath;
            this.playArgs = urlInfo.query;
            this.onPlay();
        }
        else {
            this.stop();
        }
    };
    NodeFlvSession.prototype.stop = function () {
        if (this.isStarting) {
            this.isStarting = false;
            var publisherId = context.publishers.get(this.playStreamPath);
            if (publisherId != null) {
                context.sessions.get(publisherId).players.delete(this.id);
                context.nodeEvent.emit('donePlay', this.id, this.playStreamPath, this.playArgs);
            }
            Logger.log("[" + this.TAG + " play] Close stream. id=" + this.id + " streamPath=" + this.playStreamPath);
            Logger.log("[" + this.TAG + " disconnect] id=" + this.id);
            context.nodeEvent.emit('doneConnect', this.id, this.connectCmdObj);
            this.res.end();
            context.idlePlayers.delete(this.id);
            context.sessions.delete(this.id);
        }
    };
    NodeFlvSession.prototype.onReqClose = function () {
        this.stop();
    };
    NodeFlvSession.prototype.onReqError = function (e) {
        this.stop();
    };
    NodeFlvSession.prototype.reject = function () {
        Logger.log("[" + this.TAG + " reject] id=" + this.id);
        this.stop();
    };
    NodeFlvSession.prototype.onPlay = function () {
        context.nodeEvent.emit('prePlay', this.id, this.playStreamPath, this.playArgs);
        if (!this.isStarting) {
            return;
        }
        if (this.config.auth !== undefined && this.config.auth.play) {
            var results = NodeCoreUtils.verifyAuth(this.playArgs.sign, this.playStreamPath, this.config.auth.secret);
            if (!results) {
                Logger.log("[" + this.TAG + " play] Unauthorized. id=" + this.id + " streamPath=" + this.playStreamPath + " sign=" + this.playArgs.sign);
                this.res.statusCode = 403;
                this.res.end();
                return;
            }
        }
        if (!context.publishers.has(this.playStreamPath)) {
            Logger.log("[" + this.TAG + " play] Stream not found. id=" + this.id + " streamPath=" + this.playStreamPath + " ");
            context.idlePlayers.add(this.id);
            this.isIdling = true;
            return;
        }
        this.onStartPlay();
    };
    NodeFlvSession.prototype.onStartPlay = function () {
        var publisherId = context.publishers.get(this.playStreamPath);
        var publisher = context.sessions.get(publisherId);
        var players = publisher.players;
        players.add(this.id);
        //send FLV header
        var FLVHeader = Buffer.from([0x46, 0x4c, 0x56, 0x01, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00]);
        if (publisher.isFirstAudioReceived) {
            FLVHeader[4] |= 4;
        }
        if (publisher.isFirstVideoReceived) {
            FLVHeader[4] |= 1;
        }
        this.res.write(FLVHeader);
        //send Metadata
        if (publisher.metaData != null) {
            var packet = FlvPacket.create(publisher.metaData, 18);
            var tag = NodeFlvSession.createFlvTag(packet);
            this.res.write(tag);
        }
        //send aacSequenceHeader
        if (publisher.audioCodec == 10) {
            var packet = FlvPacket.create(publisher.aacSequenceHeader, 8);
            var tag = NodeFlvSession.createFlvTag(packet);
            this.res.write(tag);
        }
        //send avcSequenceHeader
        if (publisher.videoCodec == 7 || publisher.videoCodec == 12) {
            var packet = FlvPacket.create(publisher.avcSequenceHeader, 9);
            var tag = NodeFlvSession.createFlvTag(packet);
            this.res.write(tag);
        }
        //send gop cache
        if (publisher.flvGopCacheQueue != null) {
            for (var _i = 0, _a = publisher.flvGopCacheQueue; _i < _a.length; _i++) {
                var tag = _a[_i];
                this.res.write(tag);
            }
        }
        this.isIdling = false;
        this.isPlaying = true;
        Logger.log("[" + this.TAG + " play] Join stream. id=" + this.id + " streamPath=" + this.playStreamPath + " ");
        context.nodeEvent.emit('postPlay', this.id, this.playStreamPath, this.playArgs);
    };
    NodeFlvSession.createFlvTag = function (packet) {
        var PreviousTagSize = 11 + packet.header.length;
        var tagBuffer = Buffer.alloc(PreviousTagSize + 4);
        tagBuffer[0] = packet.header.type;
        tagBuffer.writeUIntBE(packet.header.length, 1, 3);
        tagBuffer[4] = (packet.header.timestamp >> 16) & 0xff;
        tagBuffer[5] = (packet.header.timestamp >> 8) & 0xff;
        tagBuffer[6] = packet.header.timestamp & 0xff;
        tagBuffer[7] = (packet.header.timestamp >> 24) & 0xff;
        tagBuffer.writeUIntBE(0, 8, 3);
        tagBuffer.writeUInt32BE(PreviousTagSize, PreviousTagSize);
        packet.payload.copy(tagBuffer, 11, 0, packet.header.length);
        return tagBuffer;
    };
    return NodeFlvSession;
}());
module.exports = NodeFlvSession;
