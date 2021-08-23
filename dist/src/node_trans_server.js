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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
//
//  Created by Mingliang Chen on 18/3/9.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var Logger = require('./node_core_logger');
var NodeTransSession = require('./node_trans_session');
var context = require('./node_core_ctx');
var _a = require('./node_core_utils'), getFFmpegVersion = _a.getFFmpegVersion, getFFmpegUrl = _a.getFFmpegUrl;
var fs = require('fs');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var ws = require('ws');
var NodeTransServer = /** @class */ (function () {
    function NodeTransServer(config) {
        this.config = config;
        this.transSessions = new Map();
    }
    NodeTransServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var version, i, apps;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            mkdirp.sync(this.config.http.mediaroot);
                            fs.accessSync(this.config.http.mediaroot, fs.constants.W_OK);
                        }
                        catch (error) {
                            Logger.error("Node Media Trans Server startup failed. MediaRoot:" + this.config.http.mediaroot + " cannot be written.");
                            return [2 /*return*/];
                        }
                        try {
                            fs.accessSync(this.config.trans.ffmpeg, fs.constants.X_OK);
                        }
                        catch (error) {
                            Logger.error("Node Media Trans Server startup failed. ffmpeg:" + this.config.trans.ffmpeg + " cannot be executed.");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getFFmpegVersion(this.config.trans.ffmpeg)];
                    case 1:
                        version = _a.sent();
                        if (version === '' || parseInt(version.split('.')[0]) < 4) {
                            Logger.error('Node Media Trans Server startup failed. ffmpeg requires version 4.0.0 above');
                            Logger.error('Download the latest ffmpeg static program:', getFFmpegUrl());
                            return [2 /*return*/];
                        }
                        i = this.config.trans.tasks.length;
                        apps = '';
                        while (i--) {
                            apps += this.config.trans.tasks[i].app;
                            apps += ' ';
                        }
                        context.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
                        context.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
                        Logger.log("Node Media Trans Server started for apps: [ " + apps + "] , MediaRoot: " + this.config.http.mediaroot + ", ffmpeg version: " + version);
                        this.wsServer.on('connection', function (ws, req) {
                            Logger.log('Node Media Trans Server: WebSocket Client Connected.');
                            this.wsServer.send({ type: 0, msg: 'Media Server Transmuxer Diagnostics Connected' });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    NodeTransServer.prototype.onPostPublish = function (id, streamPath, args) {
        var _this = this;
        var regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
        var _a = _.slice(regRes, 1), app = _a[0], name = _a[1];
        var i = this.config.trans.tasks.length;
        while (i--) {
            var conf = __assign({}, this.config.trans.tasks[i]);
            conf.ffmpeg = this.config.trans.ffmpeg;
            conf.mediaroot = this.config.http.mediaroot;
            conf.rtmpPort = this.config.rtmp.port;
            conf.streamPath = streamPath;
            conf.streamApp = app;
            conf.streamName = name;
            conf.args = args;
            if (app === conf.app) {
                var session = new NodeTransSession(conf);
                this.transSessions.set(id, session);
                session.on('data', function (millisecondsElapsed) {
                    _this.emit('ffdata', { type: 1, millisecondsElapsed: millisecondsElapsed });
                });
                session.on('error', function (err) {
                    _this.emit('fferror', { type: 2, err: err });
                });
                session.on('end', function () {
                    _this.emit('ffend');
                    _this.transSessions.delete(id);
                });
                session.run();
            }
        }
    };
    NodeTransServer.prototype.onDonePublish = function (id, streamPath, args) {
        var session = this.transSessions.get(id);
        if (session) {
            session.end();
        }
    };
    return NodeTransServer;
}());
module.exports = NodeTransServer;
