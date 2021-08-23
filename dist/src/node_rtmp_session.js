//
//  Created by Mingliang Chen on 18/4/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var QueryString = require('querystring');
var AV = require('./node_core_av');
var _a = require('./node_core_av'), AUDIO_SOUND_RATE = _a.AUDIO_SOUND_RATE, AUDIO_CODEC_NAME = _a.AUDIO_CODEC_NAME, VIDEO_CODEC_NAME = _a.VIDEO_CODEC_NAME;
var AMF = require('./node_core_amf');
var Handshake = require('./node_rtmp_handshake');
var NodeCoreUtils = require('./node_core_utils');
var NodeFlvSession = require('./node_flv_session');
var context = require('./node_core_ctx');
var Logger = require('./node_core_logger');
var N_CHUNK_STREAM = 8;
var RTMP_VERSION = 3;
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
var MAX_CHUNK_HEADER = 18;
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
            payload: null,
            capacity: 0,
            bytes: 0
        };
    }
};
var NodeRtmpSession = /** @class */ (function () {
    function NodeRtmpSession(config, socket) {
        this.config = config;
        this.socket = socket;
        this.res = socket;
        this.id = NodeCoreUtils.generateNewSessionID();
        this.ip = socket.remoteAddress;
        this.TAG = 'rtmp';
        this.handshakePayload = Buffer.alloc(RTMP_HANDSHAKE_SIZE);
        this.handshakeState = RTMP_HANDSHAKE_UNINIT;
        this.handshakeBytes = 0;
        this.parserBuffer = Buffer.alloc(MAX_CHUNK_HEADER);
        this.parserState = RTMP_PARSE_INIT;
        this.parserBytes = 0;
        this.parserBasicBytes = 0;
        this.parserPacket = null;
        this.inPackets = new Map();
        this.inChunkSize = RTMP_CHUNK_SIZE;
        this.outChunkSize = config.rtmp.chunk_size ? config.rtmp.chunk_size : RTMP_CHUNK_SIZE;
        this.pingTime = config.rtmp.ping ? config.rtmp.ping * 1000 : RTMP_PING_TIME;
        this.pingTimeout = config.rtmp.ping_timeout ? config.rtmp.ping_timeout * 1000 : RTMP_PING_TIMEOUT;
        this.pingInterval = null;
        this.isLocal = this.ip === '127.0.0.1' || this.ip === '::1' || this.ip == '::ffff:127.0.0.1';
        this.isStarting = false;
        this.isPublishing = false;
        this.isPlaying = false;
        this.isIdling = false;
        this.isPause = false;
        this.isReceiveAudio = true;
        this.isReceiveVideo = true;
        this.metaData = null;
        this.aacSequenceHeader = null;
        this.avcSequenceHeader = null;
        this.audioCodec = 0;
        this.audioCodecName = '';
        this.audioProfileName = '';
        this.audioSamplerate = 0;
        this.audioChannels = 1;
        this.videoCodec = 0;
        this.videoCodecName = '';
        this.videoProfileName = '';
        this.videoWidth = 0;
        this.videoHeight = 0;
        this.videoFps = 0;
        this.videoCount = 0;
        this.videoLevel = 0;
        this.bitrate = 0;
        this.gopCacheEnable = config.rtmp.gop_cache;
        this.rtmpGopCacheQueue = null;
        this.flvGopCacheQueue = null;
        this.ackSize = 0;
        this.inAckSize = 0;
        this.inLastAck = 0;
        this.appname = '';
        this.streams = 0;
        this.playStreamId = 0;
        this.playStreamPath = '';
        this.playArgs = {};
        this.publishStreamId = 0;
        this.publishStreamPath = '';
        this.publishArgs = {};
        this.players = new Set();
        this.numPlayCache = 0;
        this.bitrateCache = {};
        context.sessions.set(this.id, this);
    }
    NodeRtmpSession.prototype.run = function () {
        this.socket.on('data', this.onSocketData.bind(this));
        this.socket.on('close', this.onSocketClose.bind(this));
        this.socket.on('error', this.onSocketError.bind(this));
        this.socket.on('timeout', this.onSocketTimeout.bind(this));
        this.socket.setTimeout(this.pingTimeout);
        this.isStarting = true;
    };
    NodeRtmpSession.prototype.stop = function () {
        if (this.isStarting) {
            this.isStarting = false;
            if (this.playStreamId > 0) {
                this.onDeleteStream({ streamId: this.playStreamId });
            }
            if (this.publishStreamId > 0) {
                this.onDeleteStream({ streamId: this.publishStreamId });
            }
            if (this.pingInterval != null) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
            Logger.log("[rtmp disconnect] id=" + this.id);
            context.nodeEvent.emit('doneConnect', this.id, this.connectCmdObj);
            context.sessions.delete(this.id);
            this.socket.destroy();
        }
    };
    NodeRtmpSession.prototype.reject = function () {
        Logger.log("[rtmp reject] id=" + this.id);
        this.stop();
    };
    NodeRtmpSession.prototype.flush = function () {
        if (this.numPlayCache > 0) {
            this.res.uncork();
        }
    };
    NodeRtmpSession.prototype.onSocketClose = function () {
        // Logger.log('onSocketClose');
        this.stop();
    };
    NodeRtmpSession.prototype.onSocketError = function (e) {
        // Logger.log('onSocketError', e);
        this.stop();
    };
    NodeRtmpSession.prototype.onSocketTimeout = function () {
        // Logger.log('onSocketTimeout');
        this.stop();
    };
    /**
     * onSocketData
     * @param {Buffer} data
     * @returns
     */
    NodeRtmpSession.prototype.onSocketData = function (data) {
        var bytes = data.length;
        var p = 0;
        var n = 0;
        while (bytes > 0) {
            switch (this.handshakeState) {
                case RTMP_HANDSHAKE_UNINIT:
                    // Logger.log('RTMP_HANDSHAKE_UNINIT');
                    this.handshakeState = RTMP_HANDSHAKE_0;
                    this.handshakeBytes = 0;
                    bytes -= 1;
                    p += 1;
                    break;
                case RTMP_HANDSHAKE_0:
                    // Logger.log('RTMP_HANDSHAKE_0');
                    n = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
                    n = n <= bytes ? n : bytes;
                    data.copy(this.handshakePayload, this.handshakeBytes, p, p + n);
                    this.handshakeBytes += n;
                    bytes -= n;
                    p += n;
                    if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
                        this.handshakeState = RTMP_HANDSHAKE_1;
                        this.handshakeBytes = 0;
                        var s0s1s2 = Handshake.generateS0S1S2(this.handshakePayload);
                        this.socket.write(s0s1s2);
                    }
                    break;
                case RTMP_HANDSHAKE_1:
                    // Logger.log('RTMP_HANDSHAKE_1');
                    n = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
                    n = n <= bytes ? n : bytes;
                    data.copy(this.handshakePayload, this.handshakeBytes, p, n);
                    this.handshakeBytes += n;
                    bytes -= n;
                    p += n;
                    if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
                        this.handshakeState = RTMP_HANDSHAKE_2;
                        this.handshakeBytes = 0;
                        this.handshakePayload = null;
                    }
                    break;
                case RTMP_HANDSHAKE_2:
                default:
                    // Logger.log('RTMP_HANDSHAKE_2');
                    return this.rtmpChunkRead(data, p, bytes);
            }
        }
    };
    NodeRtmpSession.prototype.rtmpChunkBasicHeaderCreate = function (fmt, cid) {
        var out;
        if (cid >= 64 + 255) {
            out = Buffer.alloc(3);
            out[0] = (fmt << 6) | 1;
            out[1] = (cid - 64) & 0xff;
            out[2] = ((cid - 64) >> 8) & 0xff;
        }
        else if (cid >= 64) {
            out = Buffer.alloc(2);
            out[0] = (fmt << 6) | 0;
            out[1] = (cid - 64) & 0xff;
        }
        else {
            out = Buffer.alloc(1);
            out[0] = (fmt << 6) | cid;
        }
        return out;
    };
    NodeRtmpSession.prototype.rtmpChunkMessageHeaderCreate = function (header) {
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
    /**
     * rtmpChunksCreate
     * @param {RtmpPacket} packet
     * @returns
     */
    NodeRtmpSession.prototype.rtmpChunksCreate = function (packet) {
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
            if (useExtendedTimestamp) {
                //TODO CHECK
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
    /**
     * rtmpChunkRead
     * @param {Buffer} data
     * @param {Number} p
     * @param {Number} bytes
     */
    NodeRtmpSession.prototype.rtmpChunkRead = function (data, p, bytes) {
        // Logger.log('rtmpChunkRead', p, bytes);
        var size = 0;
        var offset = 0;
        var extended_timestamp = 0;
        while (offset < bytes) {
            switch (this.parserState) {
                case RTMP_PARSE_INIT:
                    this.parserBytes = 1;
                    this.parserBuffer[0] = data[p + offset++];
                    if (0 === (this.parserBuffer[0] & 0x3f)) {
                        this.parserBasicBytes = 2;
                    }
                    else if (1 === (this.parserBuffer[0] & 0x3f)) {
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
                    if (this.parserPacket.header.timestamp === 0xffffff)
                        size += 4;
                    while (this.parserBytes < size && offset < bytes) {
                        this.parserBuffer[this.parserBytes++] = data[p + offset++];
                    }
                    if (this.parserBytes >= size) {
                        if (this.parserPacket.header.timestamp === 0xffffff) {
                            extended_timestamp = this.parserBuffer.readUInt32BE(rtmpHeaderSize[this.parserPacket.header.fmt] + this.parserBasicBytes);
                        }
                        else {
                            extended_timestamp = this.parserPacket.header.timestamp;
                        }
                        if (this.parserPacket.bytes === 0) {
                            if (RTMP_CHUNK_TYPE_0 === this.parserPacket.header.fmt) {
                                this.parserPacket.clock = extended_timestamp;
                            }
                            else {
                                this.parserPacket.clock += extended_timestamp;
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
                        if (this.parserPacket.clock > 0xffffffff) {
                            break;
                        }
                        this.rtmpHandler();
                    }
                    else if (0 === this.parserPacket.bytes % this.inChunkSize) {
                        this.parserState = RTMP_PARSE_INIT;
                    }
                    break;
            }
        }
        this.inAckSize += data.length;
        if (this.inAckSize >= 0xf0000000) {
            this.inAckSize = 0;
            this.inLastAck = 0;
        }
        if (this.ackSize > 0 && this.inAckSize - this.inLastAck >= this.ackSize) {
            this.inLastAck = this.inAckSize;
            this.sendACK(this.inAckSize);
        }
        this.bitrateCache.bytes += bytes;
        var current_time = Date.now();
        var diff = current_time - this.bitrateCache.last_update;
        if (diff >= this.bitrateCache.intervalMs) {
            this.bitrate = Math.round(this.bitrateCache.bytes * 8 / diff);
            this.bitrateCache.bytes = 0;
            this.bitrateCache.last_update = current_time;
        }
    };
    NodeRtmpSession.prototype.rtmpPacketParse = function () {
        var fmt = this.parserBuffer[0] >> 6;
        var cid = 0;
        if (this.parserBasicBytes === 2) {
            cid = 64 + this.parserBuffer[1];
        }
        else if (this.parserBasicBytes === 3) {
            cid = (64 + this.parserBuffer[1] + this.parserBuffer[2]) << 8;
        }
        else {
            cid = this.parserBuffer[0] & 0x3f;
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
        if (this.parserPacket.header.type > RTMP_TYPE_METADATA) {
            Logger.error('rtmp packet parse error.', this.parserPacket);
            this.stop();
        }
    };
    NodeRtmpSession.prototype.rtmpChunkMessageHeaderRead = function () {
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
    NodeRtmpSession.prototype.rtmpPacketAlloc = function () {
        if (this.parserPacket.capacity < this.parserPacket.header.length) {
            this.parserPacket.payload = Buffer.alloc(this.parserPacket.header.length + 1024);
            this.parserPacket.capacity = this.parserPacket.header.length + 1024;
        }
    };
    NodeRtmpSession.prototype.rtmpHandler = function () {
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
    NodeRtmpSession.prototype.rtmpControlHandler = function () {
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
    NodeRtmpSession.prototype.rtmpEventHandler = function () { };
    NodeRtmpSession.prototype.rtmpAudioHandler = function () {
        var payload = this.parserPacket.payload.slice(0, this.parserPacket.header.length);
        var sound_format = (payload[0] >> 4) & 0x0f;
        var sound_type = payload[0] & 0x01;
        var sound_size = (payload[0] >> 1) & 0x01;
        var sound_rate = (payload[0] >> 2) & 0x03;
        if (this.audioCodec == 0) {
            this.audioCodec = sound_format;
            this.audioCodecName = AUDIO_CODEC_NAME[sound_format];
            this.audioSamplerate = AUDIO_SOUND_RATE[sound_rate];
            this.audioChannels = ++sound_type;
            if (sound_format == 4) {
                this.audioSamplerate = 16000;
            }
            else if (sound_format == 5) {
                this.audioSamplerate = 8000;
            }
            else if (sound_format == 11) {
                this.audioSamplerate = 16000;
            }
            else if (sound_format == 14) {
                this.audioSamplerate = 8000;
            }
            if (sound_format != 10 && sound_format != 13) {
                Logger.log("[rtmp publish] Handle audio. id=" + this.id + " streamPath=" + this.publishStreamPath + " sound_format=" + sound_format + " sound_type=" + sound_type + " sound_size=" + sound_size + " sound_rate=" + sound_rate + " codec_name=" + this.audioCodecName + " " + this.audioSamplerate + " " + this.audioChannels + "ch");
            }
        }
        if ((sound_format == 10 || sound_format == 13) && payload[1] == 0) {
            //cache aac sequence header
            this.isFirstAudioReceived = true;
            this.aacSequenceHeader = Buffer.alloc(payload.length);
            payload.copy(this.aacSequenceHeader);
            if (sound_format == 10) {
                var info = AV.readAACSpecificConfig(this.aacSequenceHeader);
                this.audioProfileName = AV.getAACProfileName(info);
                this.audioSamplerate = info.sample_rate;
                this.audioChannels = info.channels;
            }
            else {
                this.audioSamplerate = 48000;
                this.audioChannels = payload[11];
            }
            Logger.log("[rtmp publish] Handle audio. id=" + this.id + " streamPath=" + this.publishStreamPath + " sound_format=" + sound_format + " sound_type=" + sound_type + " sound_size=" + sound_size + " sound_rate=" + sound_rate + " codec_name=" + this.audioCodecName + " " + this.audioSamplerate + " " + this.audioChannels + "ch");
        }
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_AUDIO;
        packet.header.type = RTMP_TYPE_AUDIO;
        packet.payload = payload;
        packet.header.length = packet.payload.length;
        packet.header.timestamp = this.parserPacket.clock;
        var rtmpChunks = this.rtmpChunksCreate(packet);
        var flvTag = NodeFlvSession.createFlvTag(packet);
        //cache gop
        if (this.rtmpGopCacheQueue != null) {
            if (this.aacSequenceHeader != null && payload[1] === 0) {
                //skip aac sequence header
            }
            else {
                this.rtmpGopCacheQueue.add(rtmpChunks);
                this.flvGopCacheQueue.add(flvTag);
            }
        }
        var _loop_1 = function (playerId) {
            var playerSession = context.sessions.get(playerId);
            if (playerSession.numPlayCache === 0) {
                playerSession.res.cork();
            }
            if (playerSession instanceof NodeRtmpSession) {
                if (playerSession.isStarting && playerSession.isPlaying && !playerSession.isPause && playerSession.isReceiveAudio) {
                    rtmpChunks.writeUInt32LE(playerSession.playStreamId, 8);
                    playerSession.res.write(rtmpChunks);
                }
            }
            else if (playerSession instanceof NodeFlvSession) {
                playerSession.res.write(flvTag, null, function (e) {
                    //websocket will throw a error if not set the cb when closed
                });
            }
            playerSession.numPlayCache++;
            if (playerSession.numPlayCache === 10) {
                process.nextTick(function () { return playerSession.res.uncork(); });
                playerSession.numPlayCache = 0;
            }
        };
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var playerId = _a[_i];
            _loop_1(playerId);
        }
    };
    NodeRtmpSession.prototype.rtmpVideoHandler = function () {
        var _this = this;
        var payload = this.parserPacket.payload.slice(0, this.parserPacket.header.length);
        var frame_type = (payload[0] >> 4) & 0x0f;
        var codec_id = payload[0] & 0x0f;
        if (this.videoFps === 0) {
            if (this.videoCount++ === 0) {
                setTimeout(function () {
                    _this.videoFps = Math.ceil(_this.videoCount / 5);
                }, 5000);
            }
        }
        if (codec_id == 7 || codec_id == 12) {
            //cache avc sequence header
            if (frame_type == 1 && payload[1] == 0) {
                this.avcSequenceHeader = Buffer.alloc(payload.length);
                payload.copy(this.avcSequenceHeader);
                var info = AV.readAVCSpecificConfig(this.avcSequenceHeader);
                this.videoWidth = info.width;
                this.videoHeight = info.height;
                this.videoProfileName = AV.getAVCProfileName(info);
                this.videoLevel = info.level;
                this.rtmpGopCacheQueue = this.gopCacheEnable ? new Set() : null;
                this.flvGopCacheQueue = this.gopCacheEnable ? new Set() : null;
                //Logger.log(`[rtmp publish] avc sequence header`,this.avcSequenceHeader);
            }
        }
        if (this.videoCodec == 0) {
            this.videoCodec = codec_id;
            this.videoCodecName = VIDEO_CODEC_NAME[codec_id];
            Logger.log("[rtmp publish] Handle video. id=" + this.id + " streamPath=" + this.publishStreamPath + " frame_type=" + frame_type + " codec_id=" + codec_id + " codec_name=" + this.videoCodecName + " " + this.videoWidth + "x" + this.videoHeight);
        }
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_VIDEO;
        packet.header.type = RTMP_TYPE_VIDEO;
        packet.payload = payload;
        packet.header.length = packet.payload.length;
        packet.header.timestamp = this.parserPacket.clock;
        var rtmpChunks = this.rtmpChunksCreate(packet);
        var flvTag = NodeFlvSession.createFlvTag(packet);
        //cache gop
        if ((codec_id == 7 || codec_id == 12) && this.rtmpGopCacheQueue != null) {
            if (frame_type == 1 && payload[1] == 1) {
                this.rtmpGopCacheQueue.clear();
                this.flvGopCacheQueue.clear();
            }
            if (frame_type == 1 && payload[1] == 0) {
                //skip avc sequence header
            }
            else {
                this.rtmpGopCacheQueue.add(rtmpChunks);
                this.flvGopCacheQueue.add(flvTag);
            }
        }
        var _loop_2 = function (playerId) {
            var playerSession = context.sessions.get(playerId);
            if (playerSession.numPlayCache === 0) {
                playerSession.res.cork();
            }
            if (playerSession instanceof NodeRtmpSession) {
                if (playerSession.isStarting && playerSession.isPlaying && !playerSession.isPause && playerSession.isReceiveVideo) {
                    rtmpChunks.writeUInt32LE(playerSession.playStreamId, 8);
                    playerSession.res.write(rtmpChunks);
                }
            }
            else if (playerSession instanceof NodeFlvSession) {
                playerSession.res.write(flvTag, null, function (e) {
                    //websocket will throw a error if not set the cb when closed
                });
            }
            playerSession.numPlayCache++;
            if (playerSession.numPlayCache === 10) {
                process.nextTick(function () { return playerSession.res.uncork(); });
                playerSession.numPlayCache = 0;
            }
        };
        // Logger.log(rtmpChunks);
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var playerId = _a[_i];
            _loop_2(playerId);
        }
    };
    NodeRtmpSession.prototype.rtmpDataHandler = function () {
        var offset = this.parserPacket.header.type === RTMP_TYPE_FLEX_STREAM ? 1 : 0;
        var payload = this.parserPacket.payload.slice(offset, this.parserPacket.header.length);
        var dataMessage = AMF.decodeAmf0Data(payload);
        switch (dataMessage.cmd) {
            case '@setDataFrame':
                if (dataMessage.dataObj) {
                    this.audioSamplerate = dataMessage.dataObj.audiosamplerate;
                    this.audioChannels = dataMessage.dataObj.stereo ? 2 : 1;
                    this.videoWidth = dataMessage.dataObj.width;
                    this.videoHeight = dataMessage.dataObj.height;
                    this.videoFps = dataMessage.dataObj.framerate;
                }
                var opt = {
                    cmd: 'onMetaData',
                    dataObj: dataMessage.dataObj
                };
                this.metaData = AMF.encodeAmf0Data(opt);
                var packet = RtmpPacket.create();
                packet.header.fmt = RTMP_CHUNK_TYPE_0;
                packet.header.cid = RTMP_CHANNEL_DATA;
                packet.header.type = RTMP_TYPE_DATA;
                packet.payload = this.metaData;
                packet.header.length = packet.payload.length;
                var rtmpChunks = this.rtmpChunksCreate(packet);
                var flvTag = NodeFlvSession.createFlvTag(packet);
                for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
                    var playerId = _a[_i];
                    var playerSession = context.sessions.get(playerId);
                    if (playerSession instanceof NodeRtmpSession) {
                        if (playerSession.isStarting && playerSession.isPlaying && !playerSession.isPause) {
                            rtmpChunks.writeUInt32LE(playerSession.playStreamId, 8);
                            playerSession.socket.write(rtmpChunks);
                        }
                    }
                    else if (playerSession instanceof NodeFlvSession) {
                        playerSession.res.write(flvTag, null, function (e) {
                            //websocket will throw a error if not set the cb when closed
                        });
                    }
                }
                break;
        }
    };
    NodeRtmpSession.prototype.rtmpInvokeHandler = function () {
        var offset = this.parserPacket.header.type === RTMP_TYPE_FLEX_MESSAGE ? 1 : 0;
        var payload = this.parserPacket.payload.slice(offset, this.parserPacket.header.length);
        var invokeMessage = AMF.decodeAmf0Cmd(payload);
        // Logger.log(invokeMessage);
        switch (invokeMessage.cmd) {
            case 'connect':
                this.onConnect(invokeMessage);
                break;
            case 'releaseStream':
                break;
            case 'FCPublish':
                break;
            case 'createStream':
                this.onCreateStream(invokeMessage);
                break;
            case 'publish':
                this.onPublish(invokeMessage);
                break;
            case 'play':
                this.onPlay(invokeMessage);
                break;
            case 'pause':
                this.onPause(invokeMessage);
                break;
            case 'FCUnpublish':
                break;
            case 'deleteStream':
                this.onDeleteStream(invokeMessage);
                break;
            case 'closeStream':
                this.onCloseStream();
                break;
            case 'receiveAudio':
                this.onReceiveAudio(invokeMessage);
                break;
            case 'receiveVideo':
                this.onReceiveVideo(invokeMessage);
                break;
        }
    };
    NodeRtmpSession.prototype.sendACK = function (size) {
        var rtmpBuffer = Buffer.from('02000000000004030000000000000000', 'hex');
        rtmpBuffer.writeUInt32BE(size, 12);
        this.socket.write(rtmpBuffer);
    };
    NodeRtmpSession.prototype.sendWindowACK = function (size) {
        var rtmpBuffer = Buffer.from('02000000000004050000000000000000', 'hex');
        rtmpBuffer.writeUInt32BE(size, 12);
        this.socket.write(rtmpBuffer);
    };
    NodeRtmpSession.prototype.setPeerBandwidth = function (size, type) {
        var rtmpBuffer = Buffer.from('0200000000000506000000000000000000', 'hex');
        rtmpBuffer.writeUInt32BE(size, 12);
        rtmpBuffer[16] = type;
        this.socket.write(rtmpBuffer);
    };
    NodeRtmpSession.prototype.setChunkSize = function (size) {
        var rtmpBuffer = Buffer.from('02000000000004010000000000000000', 'hex');
        rtmpBuffer.writeUInt32BE(size, 12);
        this.socket.write(rtmpBuffer);
    };
    NodeRtmpSession.prototype.sendStreamStatus = function (st, id) {
        var rtmpBuffer = Buffer.from('020000000000060400000000000000000000', 'hex');
        rtmpBuffer.writeUInt16BE(st, 12);
        rtmpBuffer.writeUInt32BE(id, 14);
        this.socket.write(rtmpBuffer);
    };
    NodeRtmpSession.prototype.sendInvokeMessage = function (sid, opt) {
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
    NodeRtmpSession.prototype.sendDataMessage = function (opt, sid) {
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_DATA;
        packet.header.type = RTMP_TYPE_DATA;
        packet.payload = AMF.encodeAmf0Data(opt);
        packet.header.length = packet.payload.length;
        packet.header.stream_id = sid;
        var chunks = this.rtmpChunksCreate(packet);
        this.socket.write(chunks);
    };
    NodeRtmpSession.prototype.sendStatusMessage = function (sid, level, code, description) {
        var opt = {
            cmd: 'onStatus',
            transId: 0,
            cmdObj: null,
            info: {
                level: level,
                code: code,
                description: description
            }
        };
        this.sendInvokeMessage(sid, opt);
    };
    NodeRtmpSession.prototype.sendRtmpSampleAccess = function (sid) {
        var opt = {
            cmd: '|RtmpSampleAccess',
            bool1: false,
            bool2: false
        };
        this.sendDataMessage(opt, sid);
    };
    NodeRtmpSession.prototype.sendPingRequest = function () {
        var currentTimestamp = Date.now() - this.startTimestamp;
        var packet = RtmpPacket.create();
        packet.header.fmt = RTMP_CHUNK_TYPE_0;
        packet.header.cid = RTMP_CHANNEL_PROTOCOL;
        packet.header.type = RTMP_TYPE_EVENT;
        packet.header.timestamp = currentTimestamp;
        packet.payload = Buffer.from([0, 6, (currentTimestamp >> 24) & 0xff, (currentTimestamp >> 16) & 0xff, (currentTimestamp >> 8) & 0xff, currentTimestamp & 0xff]);
        packet.header.length = packet.payload.length;
        var chunks = this.rtmpChunksCreate(packet);
        this.socket.write(chunks);
    };
    NodeRtmpSession.prototype.respondConnect = function (tid) {
        var opt = {
            cmd: '_result',
            transId: tid,
            cmdObj: {
                fmsVer: 'FMS/3,0,1,123',
                capabilities: 31
            },
            info: {
                level: 'status',
                code: 'NetConnection.Connect.Success',
                description: 'Connection succeeded.',
                objectEncoding: this.objectEncoding
            }
        };
        this.sendInvokeMessage(0, opt);
    };
    NodeRtmpSession.prototype.respondCreateStream = function (tid) {
        this.streams++;
        var opt = {
            cmd: '_result',
            transId: tid,
            cmdObj: null,
            info: this.streams
        };
        this.sendInvokeMessage(0, opt);
    };
    NodeRtmpSession.prototype.respondPlay = function () {
        this.sendStreamStatus(STREAM_BEGIN, this.playStreamId);
        this.sendStatusMessage(this.playStreamId, 'status', 'NetStream.Play.Reset', 'Playing and resetting stream.');
        this.sendStatusMessage(this.playStreamId, 'status', 'NetStream.Play.Start', 'Started playing stream.');
        this.sendRtmpSampleAccess();
    };
    NodeRtmpSession.prototype.onConnect = function (invokeMessage) {
        var _this = this;
        invokeMessage.cmdObj.app = invokeMessage.cmdObj.app.replace('/', ''); //fix jwplayer
        context.nodeEvent.emit('preConnect', this.id, invokeMessage.cmdObj);
        if (!this.isStarting) {
            return;
        }
        this.connectCmdObj = invokeMessage.cmdObj;
        this.appname = invokeMessage.cmdObj.app;
        this.objectEncoding = invokeMessage.cmdObj.objectEncoding != null ? invokeMessage.cmdObj.objectEncoding : 0;
        this.connectTime = new Date();
        this.startTimestamp = Date.now();
        this.pingInterval = setInterval(function () {
            _this.sendPingRequest();
        }, this.pingTime);
        this.sendWindowACK(5000000);
        this.setPeerBandwidth(5000000, 2);
        this.setChunkSize(this.outChunkSize);
        this.respondConnect(invokeMessage.transId);
        this.bitrateCache = {
            intervalMs: 1000,
            last_update: this.startTimestamp,
            bytes: 0,
        };
        Logger.log("[rtmp connect] id=" + this.id + " ip=" + this.ip + " app=" + this.appname + " args=" + JSON.stringify(invokeMessage.cmdObj));
        context.nodeEvent.emit('postConnect', this.id, invokeMessage.cmdObj);
    };
    NodeRtmpSession.prototype.onCreateStream = function (invokeMessage) {
        this.respondCreateStream(invokeMessage.transId);
    };
    NodeRtmpSession.prototype.onPublish = function (invokeMessage) {
        if (typeof invokeMessage.streamName !== 'string') {
            return;
        }
        this.publishStreamPath = '/' + this.appname + '/' + invokeMessage.streamName.split('?')[0];
        this.publishArgs = QueryString.parse(invokeMessage.streamName.split('?')[1]);
        this.publishStreamId = this.parserPacket.header.stream_id;
        context.nodeEvent.emit('prePublish', this.id, this.publishStreamPath, this.publishArgs);
        if (!this.isStarting) {
            return;
        }
        if (this.config.auth && this.config.auth.publish && !this.isLocal) {
            var results = NodeCoreUtils.verifyAuth(this.publishArgs.sign, this.publishStreamPath, this.config.auth.secret);
            if (!results) {
                Logger.log("[rtmp publish] Unauthorized. id=" + this.id + " streamPath=" + this.publishStreamPath + " streamId=" + this.publishStreamId + " sign=" + this.publishArgs.sign + " ");
                this.sendStatusMessage(this.publishStreamId, 'error', 'NetStream.publish.Unauthorized', 'Authorization required.');
                return;
            }
        }
        if (context.publishers.has(this.publishStreamPath)) {
            this.reject();
            Logger.log("[rtmp publish] Already has a stream. id=" + this.id + " streamPath=" + this.publishStreamPath + " streamId=" + this.publishStreamId);
            this.sendStatusMessage(this.publishStreamId, 'error', 'NetStream.Publish.BadName', 'Stream already publishing');
        }
        else if (this.isPublishing) {
            Logger.log("[rtmp publish] NetConnection is publishing. id=" + this.id + " streamPath=" + this.publishStreamPath + " streamId=" + this.publishStreamId);
            this.sendStatusMessage(this.publishStreamId, 'error', 'NetStream.Publish.BadConnection', 'Connection already publishing');
        }
        else {
            Logger.log("[rtmp publish] New stream. id=" + this.id + " streamPath=" + this.publishStreamPath + " streamId=" + this.publishStreamId);
            context.publishers.set(this.publishStreamPath, this.id);
            this.isPublishing = true;
            this.sendStatusMessage(this.publishStreamId, 'status', 'NetStream.Publish.Start', this.publishStreamPath + " is now published.");
            for (var _i = 0, _a = context.idlePlayers; _i < _a.length; _i++) {
                var idlePlayerId = _a[_i];
                var idlePlayer = context.sessions.get(idlePlayerId);
                if (idlePlayer && idlePlayer.playStreamPath === this.publishStreamPath) {
                    idlePlayer.onStartPlay();
                    context.idlePlayers.delete(idlePlayerId);
                }
            }
            context.nodeEvent.emit('postPublish', this.id, this.publishStreamPath, this.publishArgs);
        }
    };
    NodeRtmpSession.prototype.onPlay = function (invokeMessage) {
        if (typeof invokeMessage.streamName !== 'string') {
            return;
        }
        this.playStreamPath = '/' + this.appname + '/' + invokeMessage.streamName.split('?')[0];
        this.playArgs = QueryString.parse(invokeMessage.streamName.split('?')[1]);
        this.playStreamId = this.parserPacket.header.stream_id;
        context.nodeEvent.emit('prePlay', this.id, this.playStreamPath, this.playArgs);
        if (!this.isStarting) {
            return;
        }
        if (this.config.auth && this.config.auth.play && !this.isLocal) {
            var results = NodeCoreUtils.verifyAuth(this.playArgs.sign, this.playStreamPath, this.config.auth.secret);
            if (!results) {
                Logger.log("[rtmp play] Unauthorized. id=" + this.id + " streamPath=" + this.playStreamPath + "  streamId=" + this.playStreamId + " sign=" + this.playArgs.sign);
                this.sendStatusMessage(this.playStreamId, 'error', 'NetStream.play.Unauthorized', 'Authorization required.');
                return;
            }
        }
        if (this.isPlaying) {
            Logger.log("[rtmp play] NetConnection is playing. id=" + this.id + " streamPath=" + this.playStreamPath + "  streamId=" + this.playStreamId + " ");
            this.sendStatusMessage(this.playStreamId, 'error', 'NetStream.Play.BadConnection', 'Connection already playing');
        }
        else {
            this.respondPlay();
        }
        if (context.publishers.has(this.playStreamPath)) {
            this.onStartPlay();
        }
        else {
            Logger.log("[rtmp play] Stream not found. id=" + this.id + " streamPath=" + this.playStreamPath + "  streamId=" + this.playStreamId);
            this.isIdling = true;
            context.idlePlayers.add(this.id);
        }
    };
    NodeRtmpSession.prototype.onStartPlay = function () {
        var publisherId = context.publishers.get(this.playStreamPath);
        var publisher = context.sessions.get(publisherId);
        var players = publisher.players;
        players.add(this.id);
        if (publisher.metaData != null) {
            var packet = RtmpPacket.create();
            packet.header.fmt = RTMP_CHUNK_TYPE_0;
            packet.header.cid = RTMP_CHANNEL_DATA;
            packet.header.type = RTMP_TYPE_DATA;
            packet.payload = publisher.metaData;
            packet.header.length = packet.payload.length;
            packet.header.stream_id = this.playStreamId;
            var chunks = this.rtmpChunksCreate(packet);
            this.socket.write(chunks);
        }
        if (publisher.audioCodec === 10 || publisher.audioCodec === 13) {
            var packet = RtmpPacket.create();
            packet.header.fmt = RTMP_CHUNK_TYPE_0;
            packet.header.cid = RTMP_CHANNEL_AUDIO;
            packet.header.type = RTMP_TYPE_AUDIO;
            packet.payload = publisher.aacSequenceHeader;
            packet.header.length = packet.payload.length;
            packet.header.stream_id = this.playStreamId;
            var chunks = this.rtmpChunksCreate(packet);
            this.socket.write(chunks);
        }
        if (publisher.videoCodec === 7 || publisher.videoCodec === 12) {
            var packet = RtmpPacket.create();
            packet.header.fmt = RTMP_CHUNK_TYPE_0;
            packet.header.cid = RTMP_CHANNEL_VIDEO;
            packet.header.type = RTMP_TYPE_VIDEO;
            packet.payload = publisher.avcSequenceHeader;
            packet.header.length = packet.payload.length;
            packet.header.stream_id = this.playStreamId;
            var chunks = this.rtmpChunksCreate(packet);
            this.socket.write(chunks);
        }
        if (publisher.rtmpGopCacheQueue != null) {
            for (var _i = 0, _a = publisher.rtmpGopCacheQueue; _i < _a.length; _i++) {
                var chunks = _a[_i];
                chunks.writeUInt32LE(this.playStreamId, 8);
                this.socket.write(chunks);
            }
        }
        this.isIdling = false;
        this.isPlaying = true;
        context.nodeEvent.emit('postPlay', this.id, this.playStreamPath, this.playArgs);
        Logger.log("[rtmp play] Join stream. id=" + this.id + " streamPath=" + this.playStreamPath + "  streamId=" + this.playStreamId + " ");
    };
    NodeRtmpSession.prototype.onPause = function (invokeMessage) {
        this.isPause = invokeMessage.pause;
        var c = this.isPause ? 'NetStream.Pause.Notify' : 'NetStream.Unpause.Notify';
        var d = this.isPause ? 'Paused live' : 'Unpaused live';
        Logger.log("[rtmp play] " + d + " stream. id=" + this.id + " streamPath=" + this.playStreamPath + "  streamId=" + this.playStreamId + " ");
        if (!this.isPause) {
            this.sendStreamStatus(STREAM_BEGIN, this.playStreamId);
            if (context.publishers.has(this.playStreamPath)) {
                //fix ckplayer
                var publisherId = context.publishers.get(this.playStreamPath);
                var publisher = context.sessions.get(publisherId);
                if (publisher.audioCodec === 10 || publisher.audioCodec === 13) {
                    var packet = RtmpPacket.create();
                    packet.header.fmt = RTMP_CHUNK_TYPE_0;
                    packet.header.cid = RTMP_CHANNEL_AUDIO;
                    packet.header.type = RTMP_TYPE_AUDIO;
                    packet.payload = publisher.aacSequenceHeader;
                    packet.header.length = packet.payload.length;
                    packet.header.stream_id = this.playStreamId;
                    packet.header.timestamp = publisher.parserPacket.clock; // ?? 0 or clock
                    var chunks = this.rtmpChunksCreate(packet);
                    this.socket.write(chunks);
                }
                if (publisher.videoCodec === 7 || publisher.videoCodec === 12) {
                    var packet = RtmpPacket.create();
                    packet.header.fmt = RTMP_CHUNK_TYPE_0;
                    packet.header.cid = RTMP_CHANNEL_VIDEO;
                    packet.header.type = RTMP_TYPE_VIDEO;
                    packet.payload = publisher.avcSequenceHeader;
                    packet.header.length = packet.payload.length;
                    packet.header.stream_id = this.playStreamId;
                    packet.header.timestamp = publisher.parserPacket.clock; // ?? 0 or clock
                    var chunks = this.rtmpChunksCreate(packet);
                    this.socket.write(chunks);
                }
            }
        }
        else {
            this.sendStreamStatus(STREAM_EOF, this.playStreamId);
        }
        this.sendStatusMessage(this.playStreamId, c, d);
    };
    NodeRtmpSession.prototype.onReceiveAudio = function (invokeMessage) {
        this.isReceiveAudio = invokeMessage.bool;
        Logger.log("[rtmp play] receiveAudio=" + this.isReceiveAudio + " id=" + this.id + " ");
    };
    NodeRtmpSession.prototype.onReceiveVideo = function (invokeMessage) {
        this.isReceiveVideo = invokeMessage.bool;
        Logger.log("[rtmp play] receiveVideo=" + this.isReceiveVideo + " id=" + this.id + " ");
    };
    NodeRtmpSession.prototype.onCloseStream = function () {
        //red5-publisher
        var closeStream = { streamId: this.parserPacket.header.stream_id };
        this.onDeleteStream(closeStream);
    };
    NodeRtmpSession.prototype.onDeleteStream = function (invokeMessage) {
        if (invokeMessage.streamId == this.playStreamId) {
            if (this.isIdling) {
                context.idlePlayers.delete(this.id);
                this.isIdling = false;
            }
            else {
                var publisherId = context.publishers.get(this.playStreamPath);
                if (publisherId != null) {
                    context.sessions.get(publisherId).players.delete(this.id);
                }
                context.nodeEvent.emit('donePlay', this.id, this.playStreamPath, this.playArgs);
                this.isPlaying = false;
            }
            Logger.log("[rtmp play] Close stream. id=" + this.id + " streamPath=" + this.playStreamPath + " streamId=" + this.playStreamId);
            if (this.isStarting) {
                this.sendStatusMessage(this.playStreamId, 'status', 'NetStream.Play.Stop', 'Stopped playing stream.');
            }
            this.playStreamId = 0;
            this.playStreamPath = '';
        }
        if (invokeMessage.streamId == this.publishStreamId) {
            if (this.isPublishing) {
                Logger.log("[rtmp publish] Close stream. id=" + this.id + " streamPath=" + this.publishStreamPath + " streamId=" + this.publishStreamId);
                context.nodeEvent.emit('donePublish', this.id, this.publishStreamPath, this.publishArgs);
                if (this.isStarting) {
                    this.sendStatusMessage(this.publishStreamId, 'status', 'NetStream.Unpublish.Success', this.publishStreamPath + " is now unpublished.");
                }
                for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
                    var playerId = _a[_i];
                    var playerSession = context.sessions.get(playerId);
                    if (playerSession instanceof NodeRtmpSession) {
                        playerSession.sendStatusMessage(playerSession.playStreamId, 'status', 'NetStream.Play.UnpublishNotify', 'stream is now unpublished.');
                        playerSession.flush();
                    }
                    else {
                        playerSession.stop();
                    }
                }
                //let the players to idlePlayers
                for (var _b = 0, _c = this.players; _b < _c.length; _b++) {
                    var playerId = _c[_b];
                    var playerSession = context.sessions.get(playerId);
                    context.idlePlayers.add(playerId);
                    playerSession.isPlaying = false;
                    playerSession.isIdling = true;
                    if (playerSession instanceof NodeRtmpSession) {
                        playerSession.sendStreamStatus(STREAM_EOF, playerSession.playStreamId);
                    }
                }
                context.publishers.delete(this.publishStreamPath);
                if (this.rtmpGopCacheQueue) {
                    this.rtmpGopCacheQueue.clear();
                }
                if (this.flvGopCacheQueue) {
                    this.flvGopCacheQueue.clear();
                }
                this.players.clear();
                this.isPublishing = false;
            }
            this.publishStreamId = 0;
            this.publishStreamPath = '';
        }
    };
    return NodeRtmpSession;
}());
module.exports = NodeRtmpSession;
