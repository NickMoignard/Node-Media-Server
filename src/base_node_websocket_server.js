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
// import Logger from '../node_core_logger'
// import { StreamConf } from "../types"
// import { CLIENT_ACTIONS } from "../types/enums"
var FfmpegProcess_1 = __importDefault(require("./FfmpegProcess"));
/**
 * Ffmpeg Session with a websocket connection as input
 * @extends FfmpegProcess
 */
var BaseWebSocketSession = /** @class */ (function (_super) {
    __extends(BaseWebSocketSession, _super);
    function BaseWebSocketSession(id, ws) {
        var _this = _super.call(this, id) || this;
        _this.ws = ws;
        _this.addWebSocketEventListners();
        _this.start = new Date();
        return _this;
    }
    BaseWebSocketSession.prototype.addWebSocketEventListners = function () {
        var _this = this;
        // EVENT LISTENERS
        var websocketEventsMap = new Map([
            ['close', this.websocketClosedEventHandler],
            ['error', this.websocketErrorEventHandler],
            ['message', this.websocketMessageEventHandler],
            ['open', this.websocketOpenEventHandler],
            ['ping', this.websocketPingEventHandler],
            ['pong', this.websocketPongEventHandler],
            ['unexpected-response', this.websocketUnExpResEventHandler],
            ['upgrade', this.websocketUpgradeEventHandler],
        ]);
        Object.keys(websocketEventsMap).forEach(function (key) {
            var func = websocketEventsMap.get(key);
            _this.ws.on(key, func);
        });
    };
    BaseWebSocketSession.prototype.websocketMessageEventHandler = function (_data, _isBinary) {
        this.emit('data', new Date().valueOf() - this.start.valueOf());
    };
    BaseWebSocketSession.prototype.websocketErrorEventHandler = function (_error) {
    };
    BaseWebSocketSession.prototype.websocketClosedEventHandler = function (_code, _reason) {
    };
    BaseWebSocketSession.prototype.websocketOpenEventHandler = function () {
    };
    BaseWebSocketSession.prototype.websocketPingEventHandler = function () {
    };
    BaseWebSocketSession.prototype.websocketPongEventHandler = function () {
    };
    BaseWebSocketSession.prototype.websocketUnExpResEventHandler = function () {
    };
    BaseWebSocketSession.prototype.websocketUpgradeEventHandler = function () {
    };
    return BaseWebSocketSession;
}(FfmpegProcess_1.default));
exports.default = BaseWebSocketSession;
