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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_core_logger_1 = __importDefault(require("./node_core_logger"));
var node_websocket_session_1 = __importDefault(require("./node_websocket_session"));
// import { getFFmpegVersion, getFFmpegUrl } from "../node_core_utils"
// import context from "../node_core_ctx"
var fs_1 = __importDefault(require("fs"));
var mkdirp_1 = __importDefault(require("mkdirp"));
var events_1 = __importDefault(require("events"));
var ws_1 = __importDefault(require("ws"));
var url_1 = __importDefault(require("url"));
var enums_1 = require("./types/enums");
var context = require('./node_core_ctx');
/**
 * Event emitting websocket stream server
 * @extends EventEmitter
 */
var WebSocketStreamServer = /** @class */ (function (_super) {
    __extends(WebSocketStreamServer, _super);
    // TODO: - add authentication to publish routes
    /**
     * Create a websocket stream server
     * @param {NodeMediaServerConfig} config - The configuration for server setup
     * @returns
     */
    function WebSocketStreamServer(config) {
        var _this = _super.call(this) || this;
        node_core_logger_1.default.log('Web Socket stream server started listening on 8080');
        if (!config.stream)
            throw new Error('Incorrect Stream Config');
        _this.config = config;
        _this.streamSessions = new Map();
        _this.wsServer = new ws_1.default.Server({ port: 8080 });
        // Check media root directory
        try {
            mkdirp_1.default.sync(config.stream.mediaroot);
            fs_1.default.accessSync(config.stream.mediaroot, fs_1.default.constants.W_OK);
        }
        catch (error) {
            node_core_logger_1.default.error("Node Media Stream Server startup failed. MediaRoot:" + config.stream.mediaroot + " cannot be written.");
            return _this;
        }
        // Check for ffmpeg
        try {
            fs_1.default.accessSync(config.stream.ffmpeg, fs_1.default.constants.X_OK);
        }
        catch (error) {
            node_core_logger_1.default.error("Node Media Stream Server startup failed. ffmpeg:" + config.stream.ffmpeg + " cannot be executed.");
            return _this;
        }
        // // add event listeners
        // const serverEventsMap = new Map<string, (...args: any[]) => void>([
        //   ['connection', this.connection],
        //   ['error', this.error],
        //   ['headers', this.headers],
        //   ['close', this.close]
        // ])
        // Object.keys(serverEventsMap).forEach(key =>
        //    this.wsServer.on(key, serverEventsMap.get(key) as (...args: any[]) => void)
        // )
        _this.connection = _this.connection.bind(_this);
        _this.error = _this.error.bind(_this);
        _this.headers = _this.headers.bind(_this);
        _this.listening = _this.listening.bind(_this);
        _this.wsServer.on('connection', _this.connection);
        _this.wsServer.on('error', _this.error);
        _this.wsServer.on('headers', _this.headers);
        _this.wsServer.on('listening', _this.listening);
        return _this;
    }
    WebSocketStreamServer.prototype.connection = function (ws, req) {
        var _a, _b, _c, _d;
        if (!req.url)
            return;
        var streamPath = url_1.default.parse(req.url).pathname;
        if (!streamPath) {
            node_core_logger_1.default.error('Inncorrect Stream Path supplied on connection');
            return;
        }
        var _e = streamPath.split('/'), _ = _e[0], app = _e[1], name = _e[2];
        if (!((_a = this.config.stream) === null || _a === void 0 ? void 0 : _a.ffmpeg) || !((_b = this.config.stream) === null || _b === void 0 ? void 0 : _b.mediaroot)) {
            throw new Error("Couldn't record stream. Check mediaroot and ffmpeg path");
        }
        if (!this.config)
            throw new Error('Config not set!');
        var conf = __assign(__assign({}, this.config.stream), { ffmpeg: (_c = this.config.stream) === null || _c === void 0 ? void 0 : _c.ffmpeg, mediaroot: (_d = this.config.stream) === null || _d === void 0 ? void 0 : _d.mediaroot, streamPath: streamPath, streamName: name, streamApp: app });
        if (app === conf.app) {
            var id = streamPath;
            var session_1 = new node_websocket_session_1.default(conf, id, ws);
            this.streamSessions.set(id, session_1);
            var sessionEventsMap_1 = new Map([
                ['data', this.sessionData],
                ['error', this.sessionError],
                ['end', this.sessionEnd]
            ]);
            this.sessionData = this.sessionData.bind(this);
            this.sessionError = this.sessionError.bind(this);
            this.sessionEnd = this.sessionEnd.bind(this);
            Object.keys(sessionEventsMap_1).forEach(function (key) {
                session_1.on(key, sessionEventsMap_1.get(key));
            });
            session_1.run();
        }
    };
    WebSocketStreamServer.prototype.sessionData = function (millisecondsElapsed) {
        this.emit(enums_1.HLS_CODES.data.toString(), millisecondsElapsed);
    };
    WebSocketStreamServer.prototype.sessionError = function (_err) {
        this.emit("" + enums_1.HLS_CODES.error);
    };
    WebSocketStreamServer.prototype.sessionEnd = function (id) {
        this.emit("" + enums_1.HLS_CODES.finished);
        this.streamSessions.delete(id);
    };
    WebSocketStreamServer.prototype.error = function (error) {
        node_core_logger_1.default.error("Web Socket Server Error Event: " + error.message);
    };
    WebSocketStreamServer.prototype.headers = function (_headers, _req) {
        // nothing atm
    };
    WebSocketStreamServer.prototype.close = function () {
        var _this = this;
        Object.keys(this.streamSessions).forEach(function (key) {
            var session = _this.streamSessions.get(key);
            session && session.stopFfmpeg();
        });
    };
    WebSocketStreamServer.prototype.listening = function () {
        if (this.wsServer) {
            node_core_logger_1.default.log("WebSocket Server listening at: " + this.wsServer.address());
        }
        node_core_logger_1.default.log('Websocket Listening Event triggered');
    };
    return WebSocketStreamServer;
}(events_1.default));
module.exports = WebSocketStreamServer;
exports.default = WebSocketStreamServer;
