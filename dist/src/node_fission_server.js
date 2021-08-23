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
//  Created by Chen Mingliang on 20/7/16.
//  illuspas[a]msn.com
//  Copyright (c) 2020 Nodemedia. All rights reserved.
//
var Logger = require('./node_core_logger');
var NodeFissionSession = require('./node_fission_session');
var context = require('./node_core_ctx');
var _a = require('./node_core_utils'), getFFmpegVersion = _a.getFFmpegVersion, getFFmpegUrl = _a.getFFmpegUrl;
var fs = require('fs');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var NodeFissionServer = /** @class */ (function () {
    function NodeFissionServer(config) {
        this.config = config;
        this.fissionSessions = new Map();
    }
    NodeFissionServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var version;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            mkdirp.sync(this.config.http.mediaroot);
                            fs.accessSync(this.config.http.mediaroot, fs.constants.W_OK);
                        }
                        catch (error) {
                            Logger.error("Node Media Fission Server startup failed. MediaRoot:" + this.config.http.mediaroot + " cannot be written.");
                            return [2 /*return*/];
                        }
                        try {
                            fs.accessSync(this.config.fission.ffmpeg, fs.constants.X_OK);
                        }
                        catch (error) {
                            Logger.error("Node Media Fission Server startup failed. ffmpeg:" + this.config.fission.ffmpeg + " cannot be executed.");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getFFmpegVersion(this.config.fission.ffmpeg)];
                    case 1:
                        version = _a.sent();
                        if (version === '' || parseInt(version.split('.')[0]) < 4) {
                            Logger.error('Node Media Fission Server startup failed. ffmpeg requires version 4.0.0 above');
                            Logger.error('Download the latest ffmpeg static program:', getFFmpegUrl());
                            return [2 /*return*/];
                        }
                        context.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
                        context.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
                        Logger.log("Node Media Fission Server started, MediaRoot: " + this.config.http.mediaroot + ", ffmpeg version: " + version);
                        return [2 /*return*/];
                }
            });
        });
    };
    NodeFissionServer.prototype.onPostPublish = function (id, streamPath, args) {
        var _this = this;
        var regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
        var _a = _.slice(regRes, 1), app = _a[0], name = _a[1];
        for (var _i = 0, _b = this.config.fission.tasks; _i < _b.length; _i++) {
            var task = _b[_i];
            regRes = /(.*)\/(.*)/gi.exec(task.rule);
            var _c = _.slice(regRes, 1), ruleApp = _c[0], ruleName = _c[1];
            if ((app === ruleApp || ruleApp === '*') && (name === ruleName || ruleName === '*')) {
                var s = context.sessions.get(id);
                if (s.isLocal && name.split('_')[1]) {
                    continue;
                }
                var conf = task;
                conf.ffmpeg = this.config.fission.ffmpeg;
                conf.mediaroot = this.config.http.mediaroot;
                conf.rtmpPort = this.config.rtmp.port;
                conf.streamPath = streamPath;
                conf.streamApp = app;
                conf.streamName = name;
                conf.args = args;
                var session = new NodeFissionSession(conf);
                this.fissionSessions.set(id, session);
                session.on('end', function () {
                    _this.fissionSessions.delete(id);
                });
                session.run();
            }
        }
    };
    NodeFissionServer.prototype.onDonePublish = function (id, streamPath, args) {
        var session = this.fissionSessions.get(id);
        if (session) {
            session.end();
        }
    };
    return NodeFissionServer;
}());
module.exports = NodeFissionServer;
