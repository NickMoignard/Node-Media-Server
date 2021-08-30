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
/* eslint-disable no-unused-expressions */
var fs_1 = __importDefault(require("fs"));
var mkdirp_1 = __importDefault(require("mkdirp"));
// import ArgvArray from "./helpers/classes/ArgvArray"F
var node_core_logger_1 = __importDefault(require("./node_core_logger"));
var enums_1 = require("./types/enums");
var base_node_websocket_server_1 = __importDefault(require("./base_node_websocket_server"));
var wsToHlsFfmpegConf_1 = require("./helpers/classes/wsToHlsFfmpegConf");
/**
 * Event emitting websocket stream session
 * @extends BaseWebSocketSession
 */
var WebSocketSession = /** @class */ (function (_super) {
    __extends(WebSocketSession, _super);
    function WebSocketSession(conf, id, ws) {
        var _this = _super.call(this, id, ws) || this;
        node_core_logger_1.default.log('WebSocketSession constructor');
        _this.conf = conf;
        _this.argv = new wsToHlsFfmpegConf_1.WSHevcConfig(_this.conf.streamPath).args();
        _this.addWebSocketEventListners();
        return _this;
    }
    // Class Methods
    WebSocketSession.prototype.run = function () {
        // Check media root directory
        try {
            mkdirp_1.default.sync(this.conf.mediaroot + "/" + this.conf.streamApp + "/" + this.conf.streamName);
            fs_1.default.accessSync(this.conf.mediaroot + "/" + this.conf.streamApp + "/" + this.conf.streamName, fs_1.default.constants.W_OK);
            node_core_logger_1.default.log(this.conf.mediaroot + "/" + this.conf.streamApp + "/" + this.conf.streamName);
        }
        catch (error) {
            node_core_logger_1.default.error("Node Media Stream Server startup failed. MediaRoot:" + this.conf.mediaroot + "/" + this.conf.streamName + " cannot be written.");
            return;
        }
        this.conf.streamPath &&
            _super.prototype.run.call(this, this.conf.ffmpeg, this.argv, this.conf.streamPath);
        node_core_logger_1.default.log('Web Socket Session Started');
    };
    WebSocketSession.prototype.pauseSession = function () {
        var temp = this.conf;
    };
    WebSocketSession.prototype.unpauseSession = function () {
        var temp = this.conf;
    };
    WebSocketSession.prototype.resetSession = function () {
        // look for files and delete / copy them
        var temp = this.conf;
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
    WebSocketSession.prototype.addWebSocketEventListners = function () {
        // EVENT LISTENERS
        this.websocketClosedEventHandler =
            this.websocketClosedEventHandler.bind(this);
        this.ws.on('close', this.websocketClosedEventHandler);
        this.websocketErrorEventHandler = this.websocketErrorEventHandler.bind(this);
        this.ws.on('error', this.websocketErrorEventHandler);
        this.websocketMessageEventHandler =
            this.websocketMessageEventHandler.bind(this);
        this.ws.on('message', this.websocketMessageEventHandler);
        this.websocketOpenEventHandler = this.websocketOpenEventHandler.bind(this);
        this.ws.on('open', this.websocketOpenEventHandler);
        this.websocketPingEventHandler = this.websocketPingEventHandler.bind(this);
        this.ws.on('ping', this.websocketPingEventHandler);
        this.websocketPongEventHandler = this.websocketPongEventHandler.bind(this);
        this.ws.on('pong', this.websocketPongEventHandler);
        this.websocketUnExpResEventHandler =
            this.websocketUnExpResEventHandler.bind(this);
        this.ws.on('unexpected-response', this.websocketUnExpResEventHandler);
        this.websocketUpgradeEventHandler =
            this.websocketUpgradeEventHandler.bind(this);
        this.ws.on('upgrade', this.websocketUpgradeEventHandler);
    };
    return WebSocketSession;
}(base_node_websocket_server_1.default));
module.exports = WebSocketSession;
exports.default = WebSocketSession;
