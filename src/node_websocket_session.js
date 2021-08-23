"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ArgvArray_1 = __importDefault(require("./helpers/classes/ArgvArray"));
var enums_1 = require("./types/enums");
var base_node_websocket_server_1 = __importDefault(require("./base_node_websocket_server"));
/**
 * Event emitting websocket stream session
 * @extends BaseWebSocketSession
 */
var WebSocketSession = /** @class */ (function (_super) {
    __extends(WebSocketSession, _super);
    function WebSocketSession(conf, id, ws) {
        var _this = _super.call(this, id, ws) || this;
        _this.conf = conf;
        _this.argv = _this.wsToHLSFfArgs(_this.conf.mediaroot + "/" + _this.conf.streamApp + "/" + _this.conf.streamName);
        return _this;
    }
    // Class Methods
    WebSocketSession.prototype.run = function () {
        this.conf.streamPath && _super.prototype.run.call(this, this.conf.ffmpeg, this.argv.list, this.conf.streamPath);
    };
    WebSocketSession.prototype.pauseSession = function () {
    };
    WebSocketSession.prototype.unpauseSession = function () {
    };
    WebSocketSession.prototype.resetSession = function () {
        // look for files and delete / copy them
    };
    // Extend Web Socket Callbacks
    WebSocketSession.prototype.websocketMessageEventHandler = function (data, isBinary) {
        _super.prototype.websocketMessageEventHandler.call(this, data, isBinary);
        switch (data) {
            case enums_1.CLIENT_ACTIONS.startRec:
                this.run();
                break;
            case enums_1.CLIENT_ACTIONS.stopRec:
                this.stopFfmpeg();
                // respond with stop OK
                break;
            case enums_1.CLIENT_ACTIONS.resetRect:
                this.resetSession();
                break;
            case enums_1.CLIENT_ACTIONS.unpauseRec:
                this.unpauseSession();
                break;
            case enums_1.CLIENT_ACTIONS.pauseRec:
                // respond with OK
                this.pauseSession();
                break;
            default:
                if (Buffer.isBuffer(data)) {
                    // get session
                    this.addBufferToFfmpeg(data);
                }
                break;
        }
    };
    WebSocketSession.prototype.websocketErrorEventHandler = function (error) {
        _super.prototype.websocketErrorEventHandler.call(this, error);
    };
    WebSocketSession.prototype.websocketClosedEventHandler = function (code, reason) {
        _super.prototype.websocketClosedEventHandler.call(this, code, reason);
        this.stopFfmpeg();
    };
    // ffmpegCloseEventHandler(code) {
    //   super.ffmpegCloseEventHandler(code)
    // ws.terminate()
    // }
    // Private
    WebSocketSession.prototype.wsToHLSFfArgs = function (_outpath) {
        var argv = new ArgvArray_1.default(['-y']); // Overwrite output files without asking.
        // no input path. we will manually add data to ffmpeg process
        argv.add(['-i', '-']);
        // note mpeg hls output
        // video codec config: low latency, adaptive bitrate
        argv.add(['-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency']);
        // audio codec config: sampling frequency (11025, 22050, 44100), bitrate 64 kbits
        argv.add(['-c:a', 'aac', '-strict', '-2', '-ar', '44100', '-b:a', '64k']);
        // audio sync
        argv.add(['-use_wallclock_as_timestamps', '1', '-async', '1']);
        // buffer size
        argv.add(['-bufsize', '1000']);
        // OUTPUT URL
        // argv.add(['-f', 'flv', rtmpUrl])
        // hls
        argv.add(["-f", "hls"]);
        argv.add(["-hls_time", "2"]);
        argv.add(["-hls_flags", "independant_segments"]);
        argv.add(["-hls_segment_type", "mpegts"]);
        // Investigate
        argv.add(["-hls_list_size", "6900"]);
        argv.add(["-hls_segment_filename", "stream_%v/data%02d.ts"]);
        argv.add(["-master_pl_name", "master.m3u8"]);
        argv.add(["-var_stream_map", '"v:0,a:0 v:1,a:1 v:2,a:2" stream_%v.m3u8']);
        return argv;
    };
    return WebSocketSession;
}(base_node_websocket_server_1.default));
module.exports = WebSocketSession;
exports.default = WebSocketSession;
