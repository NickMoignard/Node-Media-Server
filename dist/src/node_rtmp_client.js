//
//  Created by Mingliang Chen on 18/6/21.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var EventEmitter = require('events');
var Logger = require('./node_core_logger');
var Crypto = require('crypto');
var Url = require('url');
var Net = require('net');
var AMF = require('./node_core_amf');
var FLASHVER = 'LNX 9,0,124,2';
var RTMP_OUT_CHUNK_SIZE = 60000;
var RTMP_PORT = 1935;
var RTMP_HANDSHAKE_SIZE = 1536;
var RTMP_HANDSHAKE_UNINIT = 0;
var RTMP_HANDSHAKE_0 = 1;
var RTMP_HANDSHAKE_1 = 2;
var RTMP_HANDSHAKE_2 = 3;
var RTMP_PARSE_INIT = 0;
var RTMP_PARSE_BASIC_HEADER = 1;
var RTMP_PARSE_MESSAGE_HEADER = 2;
var RTMP_PARSE_EXTENDED_TIMESTAMP = 3;
var RTMP_PARSE_PAYLOAD = 4;
var RTMP_CHUNK_HEADER_MAX = 18;
var RTMP_CHUNK_TYPE_0 = 0; // 11-bytes: timestamp(3) + length(3) + stream type(1) + stream id(4)
var RTMP_CHUNK_TYPE_1 = 1; // 7-bytes: delta(3) + length(3) + stream type(1)
var RTMP_CHUNK_TYPE_2 = 2; // 3-bytes: delta(3)
var RTMP_CHUNK_TYPE_3 = 3; // 0-byte
var RTMP_CHANNEL_PROTOCOL = 2;
var RTMP_CHANNEL_INVOKE = 3;
var RTMP_CHANNEL_AUDIO = 4;
var RTMP_CHANNEL_VIDEO = 5;
var RTMP_CHANNEL_DATA = 6;
var rtmpHeaderSize = [11, 7, 3, 0];
/* Protocol Control Messages */
var RTMP_TYPE_SET_CHUNK_SIZE = 1;
var RTMP_TYPE_ABORT = 2;
var RTMP_TYPE_ACKNOWLEDGEMENT = 3; // bytes read report
var RTMP_TYPE_WINDOW_ACKNOWLEDGEMENT_SIZE = 5; // server bandwidth
var RTMP_TYPE_SET_PEER_BANDWIDTH = 6; // client bandwidth
/* User Control Messages Event (4) */
var RTMP_TYPE_EVENT = 4;
var RTMP_TYPE_AUDIO = 8;
var RTMP_TYPE_VIDEO = 9;
/* Data Message */
var RTMP_TYPE_FLEX_STREAM = 15; // AMF3
var RTMP_TYPE_DATA = 18; // AMF0
/* Shared Object Message */
var RTMP_TYPE_FLEX_OBJECT = 16; // AMF3
var RTMP_TYPE_SHARED_OBJECT = 19; // AMF0
/* Command Message */
var RTMP_TYPE_FLEX_MESSAGE = 17; // AMF3
var RTMP_TYPE_INVOKE = 20; // AMF0
/* Aggregate Message */
var RTMP_TYPE_METADATA = 22;
var RTMP_CHUNK_SIZE = 128;
var RTMP_PING_TIME = 60000;
var RTMP_PING_TIMEOUT = 30000;
var STREAM_BEGIN = 0x00;
var STREAM_EOF = 0x01;
var STREAM_DRY = 0x02;
var STREAM_EMPTY = 0x1f;
var STREAM_READY = 0x20;
var RTMP_TRANSACTION_CONNECT = 1;
var RTMP_TRANSACTION_CREATE_STREAM = 2;
var RTMP_TRANSACTION_GET_STREAM_LENGTH = 3;
var RtmpPacket = {
    create: function (fmt, cid) {
        if (fmt === void 0) { fmt = 0; }
        if (cid === void 0) { cid = 0; }
        return {
            header: {
                fmt: fmt,
                cid: cid,
                timestamp: 0,
                length: 0,
                type: 0,
                stream_id: 0
            },
            clock: 0,
            delta: 0,
            payload: null,
            capacity: 0,
            bytes: 0
        };
    }
};
var NodeRtmpClient = /** @class */ (function () {
    function NodeRtmpClient(rtmpUrl) {
        this.url = rtmpUrl;
        this.info = this.rtmpUrlParser(rtmpUrl);
        this.isPublish = false;
        this.launcher = new EventEmitter();
        this.handshakePayload = Buffer.alloc(RTMP_HANDSHAKE_SIZE);
        this.handshakeState = RTMP_HANDSHAKE_UNINIT;
        this.handshakeBytes = 0;
        this.parserBuffer = Buffer.alloc(RTMP_CHUNK_HEADER_MAX);
        this.parserState = RTMP_PARSE_INIT;
        this.parserBytes = 0;
        this.parserBasicBytes = 0;
        this.parserPacket = null;
        this.inPackets = new Map();
        this.inChunkSize = RTMP_CHUNK_SIZE;
        this.outChunkSize = RTMP_CHUNK_SIZE;
        this.streamId = 0;
        this.isSocketOpen = false;
    }
    NodeRtmpClient.prototype.onSocketData = function (data) {
        var bytes = data.length;
        var p = 0;
        var n = 0;
        while (bytes > 0) {
            switch (this.handshakeState) {
                case RTMP_HANDSHAKE_UNINIT:
                    // read s0
                    // Logger.debug('[rtmp client] read s0');
                    this.handshakeState = RTMP_HANDSHAKE_0;
                    this.handshakeBytes = 0;
                    bytes -= 1;
                    p += 1;
                    break;
                case RTMP_HANDSHAKE_0:
                    // read s1
                    n = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
                    n = n <= bytes ? n : bytes;
                    data.copy(this.handshakePayload, this.handshakeBytes, p, p + n);
                    this.handshakeBytes += n;
                    bytes -= n;
                    p += n;
                    if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
                        // Logger.debug('[rtmp client] read s1');
                        this.handshakeState = RTMP_HANDSHAKE_1;
                        this.handshakeBytes = 0;
                        this.socket.write(this.handshakePayload); // write c2;
                        // Logger.debug('[rtmp client] write c2');
                    }
                    break;
                case RTMP_HANDSHAKE_1:
                    //read s2
                    n = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
                    n = n <= bytes ? n : bytes;
                    data.copy(this.handshakePayload, this.handshakeBytes, p, n);
                    this.handshakeBytes += n;
                    bytes -= n;
                    p += n;
                    if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
                        // Logger.debug('[rtmp client] read s2');
                        this.handshakeState = RTMP_HANDSHAKE_2;
                        this.handshakeBytes = 0;
                        this.handshakePayload = null;
                        this.rtmpSendConnect();
                    }
                    break;
                case RTMP_HANDSHAKE_2:
                    return this.rtmpChunkRead(data, p, bytes);
            }
        }
    };
    NodeRtmpClient.prototype.onSocketError = function (e) {
        Logger.error('rtmp_client', 'onSocketError', e);
        this.isSocketOpen = false;
        this.stop();
    };
    NodeRtmpClient.prototype.onSocketClose = function () {
        // Logger.debug('rtmp_client', "onSocketClose");
        this.isSocketOpen = false;
        this.stop();
    };
    NodeRtmpClient.prototype.onSocketTimeout = function () {
        // Logger.debug('rtmp_client', "onSocketTimeout");
        this.isSocketOpen = false;
        this.stop();
    };
    NodeRtmpClient.prototype.on = function (event, callback) {
        this.launcher.on(event, callback);
    };
    NodeRtmpClient.prototype.startPull = function () {
        this._start();
    };
    NodeRtmpClient.prototype.startPush = function () {
        this.isPublish = true;
        this._start();
    };
    NodeRtmpClient.prototype._start = function () {
        var _this = this;
        this.socket = Net.createConnection(this.info.port, this.info.hostname, function () {
            //rtmp handshark c0c1
            var c0c1 = Crypto.randomBytes(1537);
            c0c1.writeUInt8(3);
            c0c1.writeUInt32BE(Date.now() / 1000, 1);
            c0c1.writeUInt32BE(0, 5);
            _this.socket.write(c0c1);
            // Logger.debug('[rtmp client] write c0c1');
        });
        this.socket.on('data', this.onSocketData.bind(this));
        this.socket.on('error', this.onSocketError.bind(this));
        this.socket.on('close', this.onSocketClose.bind(this));
        this.socket.on('timeout', this.onSocketTimeout.bind(this));
        this.socket.setTimeout(60000);
    };
    NodeRtmpClient.prototype.stop = function () {
        if (this.streamId > 0) {
            if (!this.socket.destroyed) {
                if (this.isPublish) {
                    this.rtmpSendFCUnpublish();
                }
                this.rtmpSendDeleteStream();
                this.socket.destroy();
            }
            this.streamId = 0;
            this.launcher.emit('close');
        }
    };
    NodeRtmpClient.prototype.pushAudio = function (audioData, timestamp) {
        if (this.streamId == 0)
            return;
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_AUDIO;
        packet.header.type = RTMP_TYPE_AUDIO;
        packet.payload = audioData;
        packet.header.length = packet.payload.length;
        packet.header.timestamp = timestamp;
        var rtmpChunks = this.rtmpChunksCreate(packet);
        this.socket.write(rtmpChunks);
    };
    NodeRtmpClient.prototype.pushVideo = function (videoData, timestamp) {
        if (this.streamId == 0)
            return;
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_VIDEO;
        packet.header.type = RTMP_TYPE_VIDEO;
        packet.payload = videoData;
        packet.header.length = packet.payload.length;
        packet.header.timestamp = timestamp;
        var rtmpChunks = this.rtmpChunksCreate(packet);
        this.socket.write(rtmpChunks);
    };
    NodeRtmpClient.prototype.pushScript = function (scriptData, timestamp) {
        if (this.streamId == 0)
            return;
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_DATA;
        packet.header.type = RTMP_TYPE_DATA;
        packet.payload = scriptData;
        packet.header.length = packet.payload.length;
        packet.header.timestamp = timestamp;
        var rtmpChunks = this.rtmpChunksCreate(packet);
        this.socket.write(rtmpChunks);
    };
    NodeRtmpClient.prototype.rtmpUrlParser = function (url) {
        var urlInfo = Url.parse(url, true);
        urlInfo.app = urlInfo.path.split('/')[1];
        urlInfo.port = urlInfo.port ? urlInfo.port : RTMP_PORT;
        urlInfo.tcurl = urlInfo.href.match(/rtmp:\/\/([^\/]+)\/([^\/]+)/)[0];
        urlInfo.stream = urlInfo.path.slice(urlInfo.app.length + 2);
        return urlInfo;
    };
    NodeRtmpClient.prototype.rtmpChunkBasicHeaderCreate = function (fmt, cid) {
        var out;
        if (cid >= 64 + 255) {
            out = Buffer.alloc(3);
            out[0] = (fmt << 6) | 1;
            out[1] = (cid - 64) & 0xFF;
            out[2] = ((cid - 64) >> 8) & 0xFF;
        }
        else if (cid >= 64) {
            out = Buffer.alloc(2);
            out[0] = (fmt << 6) | 0;
            out[1] = (cid - 64) & 0xFF;
        }
        else {
            out = Buffer.alloc(1);
            out[0] = (fmt << 6) | cid;
        }
        return out;
    };
    NodeRtmpClient.prototype.rtmpChunkMessageHeaderCreate = function (header) {
        var out = Buffer.alloc(rtmpHeaderSize[header.fmt % 4]);
        if (header.fmt <= RTMP_CHUNK_TYPE_2) {
            out.writeUIntBE(header.timestamp >= 0xffffff ? 0xffffff : header.timestamp, 0, 3);
        }
        if (header.fmt <= RTMP_CHUNK_TYPE_1) {
            out.writeUIntBE(header.length, 3, 3);
            out.writeUInt8(header.type, 6);
        }
        if (header.fmt === RTMP_CHUNK_TYPE_0) {
            out.writeUInt32LE(header.stream_id, 7);
        }
        return out;
    };
    NodeRtmpClient.prototype.rtmpChunksCreate = function (packet) {
        var header = packet.header;
        var payload = packet.payload;
        var payloadSize = header.length;
        var chunkSize = this.outChunkSize;
        var chunksOffset = 0;
        var payloadOffset = 0;
        var chunkBasicHeader = this.rtmpChunkBasicHeaderCreate(header.fmt, header.cid);
        var chunkBasicHeader3 = this.rtmpChunkBasicHeaderCreate(RTMP_CHUNK_TYPE_3, header.cid);
        var chunkMessageHeader = this.rtmpChunkMessageHeaderCreate(header);
        var useExtendedTimestamp = header.timestamp >= 0xffffff;
        var headerSize = chunkBasicHeader.length + chunkMessageHeader.length + (useExtendedTimestamp ? 4 : 0);
        var n = headerSize + payloadSize + Math.floor(payloadSize / chunkSize);
        if (useExtendedTimestamp) {
            n += Math.floor(payloadSize / chunkSize) * 4;
        }
        if (!(payloadSize % chunkSize)) {
            n -= 1;
            if (useExtendedTimestamp) { //TODO CHECK
                n -= 4;
            }
        }
        var chunks = Buffer.alloc(n);
        chunkBasicHeader.copy(chunks, chunksOffset);
        chunksOffset += chunkBasicHeader.length;
        chunkMessageHeader.copy(chunks, chunksOffset);
        chunksOffset += chunkMessageHeader.length;
        if (useExtendedTimestamp) {
            chunks.writeUInt32BE(header.timestamp, chunksOffset);
            chunksOffset += 4;
        }
        while (payloadSize > 0) {
            if (payloadSize > chunkSize) {
                payload.copy(chunks, chunksOffset, payloadOffset, payloadOffset + chunkSize);
                payloadSize -= chunkSize;
                chunksOffset += chunkSize;
                payloadOffset += chunkSize;
                chunkBasicHeader3.copy(chunks, chunksOffset);
                chunksOffset += chunkBasicHeader3.length;
                if (useExtendedTimestamp) {
                    chunks.writeUInt32BE(header.timestamp, chunksOffset);
                    chunksOffset += 4;
                }
            }
            else {
                payload.copy(chunks, chunksOffset, payloadOffset, payloadOffset + payloadSize);
                payloadSize -= payloadSize;
                chunksOffset += payloadSize;
                payloadOffset += payloadSize;
            }
        }
        return chunks;
    };
    NodeRtmpClient.prototype.rtmpChunkRead = function (data, p, bytes) {
        var size = 0;
        var offset = 0;
        var extended_timestamp = 0;
        while (offset < bytes) {
            switch (this.parserState) {
                case RTMP_PARSE_INIT:
                    this.parserBytes = 1;
                    this.parserBuffer[0] = data[p + offset++];
                    if (0 === (this.parserBuffer[0] & 0x3F)) {
                        this.parserBasicBytes = 2;
                    }
                    else if (1 === (this.parserBuffer[0] & 0x3F)) {
                        this.parserBasicBytes = 3;
                    }
                    else {
                        this.parserBasicBytes = 1;
                    }
                    this.parserState = RTMP_PARSE_BASIC_HEADER;
                    break;
                case RTMP_PARSE_BASIC_HEADER:
                    while (this.parserBytes < this.parserBasicBytes && offset < bytes) {
                        this.parserBuffer[this.parserBytes++] = data[p + offset++];
                    }
                    if (this.parserBytes >= this.parserBasicBytes) {
                        this.parserState = RTMP_PARSE_MESSAGE_HEADER;
                    }
                    break;
                case RTMP_PARSE_MESSAGE_HEADER:
                    size = rtmpHeaderSize[this.parserBuffer[0] >> 6] + this.parserBasicBytes;
                    while (this.parserBytes < size && offset < bytes) {
                        this.parserBuffer[this.parserBytes++] = data[p + offset++];
                    }
                    if (this.parserBytes >= size) {
                        this.rtmpPacketParse();
                        this.parserState = RTMP_PARSE_EXTENDED_TIMESTAMP;
                    }
                    break;
                case RTMP_PARSE_EXTENDED_TIMESTAMP:
                    size = rtmpHeaderSize[this.parserPacket.header.fmt] + this.parserBasicBytes;
                    if (this.parserPacket.header.timestamp === 0xFFFFFF)
                        size += 4;
                    while (this.parserBytes < size && offset < bytes) {
                        this.parserBuffer[this.parserBytes++] = data[p + offset++];
                    }
                    if (this.parserBytes >= size) {
                        if (this.parserPacket.header.timestamp === 0xFFFFFF) {
                            extended_timestamp = this.parserBuffer.readUInt32BE(rtmpHeaderSize[this.parserPacket.header.fmt] + this.parserBasicBytes);
                        }
                        if (0 === this.parserPacket.bytes) {
                            if (RTMP_CHUNK_TYPE_0 === this.parserPacket.header.fmt) {
                                this.parserPacket.clock = 0xFFFFFF === this.parserPacket.header.timestamp ? extended_timestamp : this.parserPacket.header.timestamp;
                                this.parserPacket.delta = 0;
                            }
                            else {
                                this.parserPacket.delta = 0xFFFFFF === this.parserPacket.header.timestamp ? extended_timestamp : this.parserPacket.header.timestamp;
                            }
                            this.rtmpPacketAlloc();
                        }
                        this.parserState = RTMP_PARSE_PAYLOAD;
                    }
                    break;
                case RTMP_PARSE_PAYLOAD:
                    size = Math.min(this.inChunkSize - (this.parserPacket.bytes % this.inChunkSize), this.parserPacket.header.length - this.parserPacket.bytes);
                    size = Math.min(size, bytes - offset);
                    if (size > 0) {
                        data.copy(this.parserPacket.payload, this.parserPacket.bytes, p + offset, p + offset + size);
                    }
                    this.parserPacket.bytes += size;
                    offset += size;
                    if (this.parserPacket.bytes >= this.parserPacket.header.length) {
                        this.parserState = RTMP_PARSE_INIT;
                        this.parserPacket.bytes = 0;
                        this.parserPacket.clock += this.parserPacket.delta;
                        this.rtmpHandler();
                    }
                    else if (0 === (this.parserPacket.bytes % this.inChunkSize)) {
                        this.parserState = RTMP_PARSE_INIT;
                    }
                    break;
            }
        }
    };
    NodeRtmpClient.prototype.rtmpPacketParse = function () {
        var fmt = this.parserBuffer[0] >> 6;
        var cid = 0;
        if (this.parserBasicBytes === 2) {
            cid = 64 + this.parserBuffer[1];
        }
        else if (this.parserBasicBytes === 3) {
            cid = 64 + this.parserBuffer[1] + this.parserBuffer[2] << 8;
        }
        else {
            cid = this.parserBuffer[0] & 0x3F;
        }
        var hasp = this.inPackets.has(cid);
        if (!hasp) {
            this.parserPacket = RtmpPacket.create(fmt, cid);
            this.inPackets.set(cid, this.parserPacket);
        }
        else {
            this.parserPacket = this.inPackets.get(cid);
        }
        this.parserPacket.header.fmt = fmt;
        this.parserPacket.header.cid = cid;
        this.rtmpChunkMessageHeaderRead();
        // Logger.log(this.parserPacket);
    };
    NodeRtmpClient.prototype.rtmpChunkMessageHeaderRead = function () {
        var offset = this.parserBasicBytes;
        // timestamp / delta
        if (this.parserPacket.header.fmt <= RTMP_CHUNK_TYPE_2) {
            this.parserPacket.header.timestamp = this.parserBuffer.readUIntBE(offset, 3);
            offset += 3;
        }
        // message length + type
        if (this.parserPacket.header.fmt <= RTMP_CHUNK_TYPE_1) {
            this.parserPacket.header.length = this.parserBuffer.readUIntBE(offset, 3);
            this.parserPacket.header.type = this.parserBuffer[offset + 3];
            offset += 4;
        }
        if (this.parserPacket.header.fmt === RTMP_CHUNK_TYPE_0) {
            this.parserPacket.header.stream_id = this.parserBuffer.readUInt32LE(offset);
            offset += 4;
        }
        return offset;
    };
    NodeRtmpClient.prototype.rtmpPacketAlloc = function () {
        if (this.parserPacket.capacity < this.parserPacket.header.length) {
            this.parserPacket.payload = Buffer.alloc(this.parserPacket.header.length + 1024);
            this.parserPacket.capacity = this.parserPacket.header.length + 1024;
        }
    };
    NodeRtmpClient.prototype.rtmpHandler = function () {
        switch (this.parserPacket.header.type) {
            case RTMP_TYPE_SET_CHUNK_SIZE:
            case RTMP_TYPE_ABORT:
            case RTMP_TYPE_ACKNOWLEDGEMENT:
            case RTMP_TYPE_WINDOW_ACKNOWLEDGEMENT_SIZE:
            case RTMP_TYPE_SET_PEER_BANDWIDTH:
                return 0 === this.rtmpControlHandler() ? -1 : 0;
            case RTMP_TYPE_EVENT:
                return 0 === this.rtmpEventHandler() ? -1 : 0;
            case RTMP_TYPE_AUDIO:
                return this.rtmpAudioHandler();
            case RTMP_TYPE_VIDEO:
                return this.rtmpVideoHandler();
            case RTMP_TYPE_FLEX_MESSAGE:
            case RTMP_TYPE_INVOKE:
                return this.rtmpInvokeHandler();
            case RTMP_TYPE_FLEX_STREAM: // AMF3
            case RTMP_TYPE_DATA: // AMF0
                return this.rtmpDataHandler();
        }
    };
    NodeRtmpClient.prototype.rtmpControlHandler = function () {
        var payload = this.parserPacket.payload;
        switch (this.parserPacket.header.type) {
            case RTMP_TYPE_SET_CHUNK_SIZE:
                this.inChunkSize = payload.readUInt32BE();
                // Logger.debug('set inChunkSize', this.inChunkSize);
                break;
            case RTMP_TYPE_ABORT:
                break;
            case RTMP_TYPE_ACKNOWLEDGEMENT:
                break;
            case RTMP_TYPE_WINDOW_ACKNOWLEDGEMENT_SIZE:
                this.ackSize = payload.readUInt32BE();
                // Logger.debug('set ack Size', this.ackSize);
                break;
            case RTMP_TYPE_SET_PEER_BANDWIDTH:
                break;
        }
    };
    NodeRtmpClient.prototype.rtmpEventHandler = function () {
        var payload = this.parserPacket.payload.slice(0, this.parserPacket.header.length);
        var event = payload.readUInt16BE();
        var value = payload.readUInt32BE(2);
        // Logger.log('rtmpEventHandler', event, value);
        switch (event) {
            case 6:
                this.rtmpSendPingResponse(value);
                break;
        }
    };
    NodeRtmpClient.prototype.rtmpInvokeHandler = function () {
        var offset = this.parserPacket.header.type === RTMP_TYPE_FLEX_MESSAGE ? 1 : 0;
        var payload = this.parserPacket.payload.slice(offset, this.parserPacket.header.length);
        var invokeMessage = AMF.decodeAmf0Cmd(payload);
        // Logger.log('rtmpInvokeHandler', invokeMessage);
        switch (invokeMessage.cmd) {
            case '_result':
                this.rtmpCommandOnresult(invokeMessage);
                break;
            case '_error':
                this.rtmpCommandOnerror(invokeMessage);
                break;
            case 'onStatus':
                this.rtmpCommandOnstatus(invokeMessage);
                break;
        }
    };
    NodeRtmpClient.prototype.rtmpCommandOnresult = function (invokeMessage) {
        // Logger.debug(invokeMessage);
        switch (invokeMessage.transId) {
            case RTMP_TRANSACTION_CONNECT:
                this.launcher.emit('status', invokeMessage.info);
                this.rtmpOnconnect();
                break;
            case RTMP_TRANSACTION_CREATE_STREAM:
                this.rtmpOncreateStream(invokeMessage.info);
                break;
        }
    };
    NodeRtmpClient.prototype.rtmpCommandOnerror = function (invokeMessage) {
        this.launcher.emit('status', invokeMessage.info);
    };
    NodeRtmpClient.prototype.rtmpCommandOnstatus = function (invokeMessage) {
        this.launcher.emit('status', invokeMessage.info);
    };
    NodeRtmpClient.prototype.rtmpOnconnect = function () {
        if (this.isPublish) {
            this.rtmpSendReleaseStream();
            this.rtmpSendFCPublish();
        }
        this.rtmpSendCreateStream();
    };
    NodeRtmpClient.prototype.rtmpOncreateStream = function (sid) {
        this.streamId = sid;
        if (this.isPublish) {
            this.rtmpSendPublish();
            this.rtmpSendSetChunkSize();
        }
        else {
            this.rtmpSendPlay();
            this.rtmpSendSetBufferLength(1000);
        }
    };
    NodeRtmpClient.prototype.rtmpAudioHandler = function () {
        var payload = this.parserPacket.payload.slice(0, this.parserPacket.header.length);
        this.launcher.emit('audio', payload, this.parserPacket.clock);
    };
    NodeRtmpClient.prototype.rtmpVideoHandler = function () {
        var payload = this.parserPacket.payload.slice(0, this.parserPacket.header.length);
        this.launcher.emit('video', payload, this.parserPacket.clock);
    };
    NodeRtmpClient.prototype.rtmpDataHandler = function () {
        var payload = this.parserPacket.payload.slice(0, this.parserPacket.header.length);
        this.launcher.emit('script', payload, this.parserPacket.clock);
    };
    NodeRtmpClient.prototype.sendInvokeMessage = function (sid, opt) {
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_INVOKE;
        packet.header.type = RTMP_TYPE_INVOKE;
        packet.header.stream_id = sid;
        packet.payload = AMF.encodeAmf0Cmd(opt);
        packet.header.length = packet.payload.length;
        var chunks = this.rtmpChunksCreate(packet);
        this.socket.write(chunks);
    };
    NodeRtmpClient.prototype.rtmpSendConnect = function () {
        var opt = {
            cmd: 'connect',
            transId: RTMP_TRANSACTION_CONNECT,
            cmdObj: {
                app: this.info.app,
                flashVer: FLASHVER,
                tcUrl: this.info.tcurl,
                fpad: 0,
                capabilities: 15,
                audioCodecs: 3191,
                videoCodecs: 252,
                videoFunction: 1,
                encoding: 0
            }
        };
        this.sendInvokeMessage(0, opt);
    };
    NodeRtmpClient.prototype.rtmpSendReleaseStream = function () {
        var opt = {
            cmd: 'releaseStream',
            transId: 0,
            cmdObj: null,
            streamName: this.info.stream,
        };
        this.sendInvokeMessage(this.streamId, opt);
    };
    NodeRtmpClient.prototype.rtmpSendFCPublish = function () {
        var opt = {
            cmd: 'FCPublish',
            transId: 0,
            cmdObj: null,
            streamName: this.info.stream,
        };
        this.sendInvokeMessage(this.streamId, opt);
    };
    NodeRtmpClient.prototype.rtmpSendCreateStream = function () {
        var opt = {
            cmd: 'createStream',
            transId: RTMP_TRANSACTION_CREATE_STREAM,
            cmdObj: null
        };
        this.sendInvokeMessage(0, opt);
    };
    NodeRtmpClient.prototype.rtmpSendPlay = function () {
        var opt = {
            cmd: 'play',
            transId: 0,
            cmdObj: null,
            streamName: this.info.stream,
            start: -2,
            duration: -1,
            reset: 1
        };
        this.sendInvokeMessage(this.streamId, opt);
    };
    NodeRtmpClient.prototype.rtmpSendSetBufferLength = function (bufferTime) {
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_PROTOCOL;
        packet.header.type = RTMP_TYPE_EVENT;
        packet.payload = Buffer.alloc(10);
        packet.header.length = packet.payload.length;
        packet.payload.writeUInt16BE(0x03);
        packet.payload.writeUInt32BE(this.streamId, 2);
        packet.payload.writeUInt32BE(bufferTime, 6);
        var chunks = this.rtmpChunksCreate(packet);
        this.socket.write(chunks);
    };
    NodeRtmpClient.prototype.rtmpSendPublish = function () {
        var opt = {
            cmd: 'publish',
            transId: 0,
            cmdObj: null,
            streamName: this.info.stream,
            type: 'live'
        };
        this.sendInvokeMessage(this.streamId, opt);
    };
    NodeRtmpClient.prototype.rtmpSendSetChunkSize = function () {
        var rtmpBuffer = Buffer.from('02000000000004010000000000000000', 'hex');
        rtmpBuffer.writeUInt32BE(this.inChunkSize, 12);
        this.socket.write(rtmpBuffer);
        this.outChunkSize = this.inChunkSize;
    };
    NodeRtmpClient.prototype.rtmpSendFCUnpublish = function () {
        var opt = {
            cmd: 'FCUnpublish',
            transId: 0,
            cmdObj: null,
            streamName: this.info.stream,
        };
        this.sendInvokeMessage(this.streamId, opt);
    };
    NodeRtmpClient.prototype.rtmpSendDeleteStream = function () {
        var opt = {
            cmd: 'deleteStream',
            transId: 0,
            cmdObj: null,
            streamId: this.streamId
        };
        this.sendInvokeMessage(this.streamId, opt);
    };
    NodeRtmpClient.prototype.rtmpSendPingResponse = function (time) {
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_PROTOCOL;
        packet.header.type = RTMP_TYPE_EVENT;
        packet.payload = Buffer.alloc(6);
        packet.header.length = packet.payload.length;
        packet.payload.writeUInt16BE(0x07);
        packet.payload.writeUInt32BE(time, 2);
        var chunks = this.rtmpChunksCreate(packet);
        this.socket.write(chunks);
    };
    return NodeRtmpClient;
}());
module.exports = NodeRtmpClient;
