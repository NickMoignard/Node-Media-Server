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
var child_process_1 = require("child_process");
var events_1 = __importDefault(require("events"));
var node_core_logger_1 = __importDefault(require("./node_core_logger"));
// import { StreamConf } from "./types"
// import { CLIENT_ACTIONS } from "./types/enums"
var FfmpegProcess = /** @class */ (function (_super) {
    __extends(FfmpegProcess, _super);
    function FfmpegProcess(id) {
        var _this = _super.call(this) || this;
        _this.id = id;
        return _this;
    }
    FfmpegProcess.prototype.run = function (ffmpegPath, argvList, _path) {
        this.ffmpeg_exec = child_process_1.spawn(ffmpegPath, argvList);
        this.addFfmpegEventListners();
    };
    FfmpegProcess.prototype.addFfmpegEventListners = function () {
        var _this = this;
        if (this.ffmpeg_exec) {
            // FFMPEG STDOUT EVENTS
            this.ffmpeg_exec.stdout &&
                this.ffmpeg_exec.stdout.on('data', this.ffmpegDataEventHandler);
            // FFMPEG STDERR EVENTS
            this.ffmpeg_exec.stderr &&
                this.ffmpeg_exec.stderr.on('data', this.ffmpegSTDOUTErrorEventHandler);
            // FFMPEG child process events
            var ffmpegEventsMap_1 = new Map([
                ['close', this.ffmpegCloseEventHandler],
                ['error', this.ffmpegErrorEventHandler],
            ]);
            Object.keys(ffmpegEventsMap_1).forEach(function (key) {
                var func = ffmpegEventsMap_1.get(key);
                func && _this.ffmpeg_exec && _this.ffmpeg_exec.on(key, func);
            });
        }
    };
    FfmpegProcess.prototype.ffmpegErrorEventHandler = function (e) {
        node_core_logger_1.default.ffdebug(e);
    };
    FfmpegProcess.prototype.ffmpegCloseEventHandler = function (_code, _signal) {
        node_core_logger_1.default.log('[Transmuxing end] ' + this.path);
        this.emit('end', this.id);
    };
    FfmpegProcess.prototype.ffmpegSTDOUTErrorEventHandler = function (error) {
        node_core_logger_1.default.ffdebug("FFerr\uFF1A" + error);
    };
    FfmpegProcess.prototype.ffmpegDataEventHandler = function (chunk) {
        node_core_logger_1.default.ffdebug("FFout: " + chunk);
    };
    FfmpegProcess.prototype.stopFfmpeg = function () {
        this.ffmpeg_exec && this.ffmpeg_exec.kill('SIGSTOP'); // or "SIGINT" for keyboard interupt
    };
    FfmpegProcess.prototype.addBufferToFfmpeg = function (buffer) {
        if (this.ffmpeg_exec) {
            this.ffmpeg_exec.stdin && this.ffmpeg_exec.stdin.write(buffer);
        }
        else {
            throw new Error('FFMPEG process cannot be found!');
        }
    };
    return FfmpegProcess;
}(events_1.default));
exports.default = FfmpegProcess;
