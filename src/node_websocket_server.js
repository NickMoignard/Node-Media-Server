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
        // add event listeners
        var serverEventsMap = new Map([
            ['connection', _this.connection],
            ['error', _this.error],
            ['headers', _this.headers],
            ['close', _this.close]
        ]);
        Object.keys(serverEventsMap).forEach(function (key) {
            return _this.wsServer.on(key, serverEventsMap.get(key));
        });
        return _this;
    }
    WebSocketStreamServer.prototype.connection = function (ws, req) {
        var _this = this;
        var _a, _b, _c, _d;
        if (!req.url)
            return;
        var streamPath = url_1.default.parse(req.url).pathname;
        if (!streamPath) {
            node_core_logger_1.default.error('Inncorrect Stream Path supplied on connection');
            return;
        }
        var _e = streamPath.split('/'), app = _e[0], name = _e[1];
        if (!((_a = this.config.stream) === null || _a === void 0 ? void 0 : _a.ffmpeg) || !((_b = this.config.stream) === null || _b === void 0 ? void 0 : _b.mediaroot)) {
            throw new Error("Couldn't record stream. Check mediaroot and ffmpeg path");
        }
        var conf = __assign(__assign({}, this.config.stream), { ffmpeg: (_c = this.config.stream) === null || _c === void 0 ? void 0 : _c.ffmpeg, mediaroot: (_d = this.config.stream) === null || _d === void 0 ? void 0 : _d.mediaroot, streamPath: streamPath, streamName: name, streamApp: app });
        if (app === conf.app) {
            var id = streamPath;
            var session_1 = new node_websocket_session_1.default(conf, id, ws);
            this.streamSessions.set(id, session_1);
            var sessionEventsMap_1 = new Map([
                ['data', function (millisecondsElapsed) {
                        _this.emit(enums_1.HLS_CODES.data.toString(), millisecondsElapsed);
                    }],
                ['error', function (_err) {
                        _this.emit("" + enums_1.HLS_CODES.error);
                    }],
                ['end', function (id) {
                        _this.emit("" + enums_1.HLS_CODES.finished);
                        _this.streamSessions.delete(id);
                    }]
            ]);
            Object.keys(sessionEventsMap_1).forEach(function (key) { return session_1.on(key, sessionEventsMap_1.get(key)); });
            session_1.run();
        }
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
        node_core_logger_1.default.log("WebSocket Server listening at: " + this.wsServer.address());
    };
    return WebSocketStreamServer;
}(events_1.default));
module.exports = WebSocketStreamServer;
exports.default = WebSocketStreamServer;
