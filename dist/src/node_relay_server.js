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
//  Created by Mingliang Chen on 18/3/16.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var Logger = require('./node_core_logger');
var NodeCoreUtils = require('./node_core_utils');
var NodeRelaySession = require('./node_relay_session');
var context = require('./node_core_ctx');
var _a = require('./node_core_utils'), getFFmpegVersion = _a.getFFmpegVersion, getFFmpegUrl = _a.getFFmpegUrl;
var fs = require('fs');
var querystring = require('querystring');
var _ = require('lodash');
var NodeRelayServer = /** @class */ (function () {
    function NodeRelayServer(config) {
        this.config = config;
        this.staticCycle = null;
        this.staticSessions = new Map();
        this.dynamicSessions = new Map();
    }
    NodeRelayServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var version;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            fs.accessSync(this.config.relay.ffmpeg, fs.constants.X_OK);
                        }
                        catch (error) {
                            Logger.error("Node Media Relay Server startup failed. ffmpeg:" + this.config.relay.ffmpeg + " cannot be executed.");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getFFmpegVersion(this.config.relay.ffmpeg)];
                    case 1:
                        version = _a.sent();
                        if (version === '' || parseInt(version.split('.')[0]) < 4) {
                            Logger.error('Node Media Relay Server startup failed. ffmpeg requires version 4.0.0 above');
                            Logger.error('Download the latest ffmpeg static program:', getFFmpegUrl());
                            return [2 /*return*/];
                        }
                        context.nodeEvent.on('relayPull', this.onRelayPull.bind(this));
                        context.nodeEvent.on('relayPush', this.onRelayPush.bind(this));
                        context.nodeEvent.on('prePlay', this.onPrePlay.bind(this));
                        context.nodeEvent.on('donePlay', this.onDonePlay.bind(this));
                        context.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
                        context.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
                        this.staticCycle = setInterval(this.onStatic.bind(this), 1000);
                        Logger.log('Node Media Relay Server started');
                        return [2 /*return*/];
                }
            });
        });
    };
    NodeRelayServer.prototype.onStatic = function () {
        var _this = this;
        if (!this.config.relay.tasks) {
            return;
        }
        var i = this.config.relay.tasks.length;
        while (i--) {
            if (this.staticSessions.has(i)) {
                continue;
            }
            var conf = this.config.relay.tasks[i];
            var isStatic = conf.mode === 'static';
            if (isStatic) {
                conf.name = conf.name ? conf.name : NodeCoreUtils.genRandomName();
                conf.ffmpeg = this.config.relay.ffmpeg;
                conf.inPath = conf.edge;
                conf.ouPath = "rtmp://127.0.0.1:" + this.config.rtmp.port + "/" + conf.app + "/" + conf.name;
                var session = new NodeRelaySession(conf);
                session.id = i;
                session.streamPath = "/" + conf.app + "/" + conf.name;
                session.on('end', function (id) {
                    _this.staticSessions.delete(id);
                });
                this.staticSessions.set(i, session);
                session.run();
                Logger.log('[relay static pull] start', i, conf.inPath, 'to', conf.ouPath);
            }
        }
    };
    //从远端拉推到本地
    NodeRelayServer.prototype.onRelayPull = function (url, app, name) {
        var _this = this;
        var conf = {};
        conf.app = app;
        conf.name = name;
        conf.ffmpeg = this.config.relay.ffmpeg;
        conf.inPath = url;
        conf.ouPath = "rtmp://127.0.0.1:" + this.config.rtmp.port + "/" + app + "/" + name;
        var session = new NodeRelaySession(conf);
        var id = session.id;
        context.sessions.set(id, session);
        session.on('end', function (id) {
            _this.dynamicSessions.delete(id);
        });
        this.dynamicSessions.set(id, session);
        session.run();
        Logger.log('[relay dynamic pull] start id=' + id, conf.inPath, 'to', conf.ouPath);
        return id;
    };
    //从本地拉推到远端
    NodeRelayServer.prototype.onRelayPush = function (url, app, name) {
        var _this = this;
        var conf = {};
        conf.app = app;
        conf.name = name;
        conf.ffmpeg = this.config.relay.ffmpeg;
        conf.inPath = "rtmp://127.0.0.1:" + this.config.rtmp.port + "/" + app + "/" + name;
        conf.ouPath = url;
        var session = new NodeRelaySession(conf);
        var id = session.id;
        context.sessions.set(id, session);
        session.on('end', function (id) {
            _this.dynamicSessions.delete(id);
        });
        this.dynamicSessions.set(id, session);
        session.run();
        Logger.log('[relay dynamic push] start id=' + id, conf.inPath, 'to', conf.ouPath);
    };
    NodeRelayServer.prototype.onPrePlay = function (id, streamPath, args) {
        var _this = this;
        if (!this.config.relay.tasks) {
            return;
        }
        var regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
        var _a = _.slice(regRes, 1), app = _a[0], stream = _a[1];
        var i = this.config.relay.tasks.length;
        while (i--) {
            var conf = this.config.relay.tasks[i];
            var isPull = conf.mode === 'pull';
            if (isPull && app === conf.app && !context.publishers.has(streamPath)) {
                var hasApp = conf.edge.match(/rtmp:\/\/([^\/]+)\/([^\/]+)/);
                conf.ffmpeg = this.config.relay.ffmpeg;
                conf.inPath = hasApp ? conf.edge + "/" + stream : "" + conf.edge + streamPath;
                conf.ouPath = "rtmp://127.0.0.1:" + this.config.rtmp.port + streamPath;
                if (Object.keys(args).length > 0) {
                    conf.inPath += '?';
                    conf.inPath += querystring.encode(args);
                }
                var session = new NodeRelaySession(conf);
                session.id = id;
                session.on('end', function (id) {
                    _this.dynamicSessions.delete(id);
                });
                this.dynamicSessions.set(id, session);
                session.run();
                Logger.log('[relay dynamic pull] start id=' + id, conf.inPath, 'to', conf.ouPath);
            }
        }
    };
    NodeRelayServer.prototype.onDonePlay = function (id, streamPath, args) {
        var session = this.dynamicSessions.get(id);
        var publisher = context.sessions.get(context.publishers.get(streamPath));
        if (session && publisher.players.size == 0) {
            session.end();
        }
    };
    NodeRelayServer.prototype.onPostPublish = function (id, streamPath, args) {
        var _this = this;
        if (!this.config.relay.tasks) {
            return;
        }
        var regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
        var _a = _.slice(regRes, 1), app = _a[0], stream = _a[1];
        var i = this.config.relay.tasks.length;
        while (i--) {
            var conf = this.config.relay.tasks[i];
            var isPush = conf.mode === 'push';
            if (isPush && app === conf.app) {
                var hasApp = conf.edge.match(/rtmp:\/\/([^\/]+)\/([^\/]+)/);
                conf.ffmpeg = this.config.relay.ffmpeg;
                conf.inPath = "rtmp://127.0.0.1:" + this.config.rtmp.port + streamPath;
                conf.ouPath = conf.appendName === false ? conf.edge : (hasApp ? conf.edge + "/" + stream : "" + conf.edge + streamPath);
                if (Object.keys(args).length > 0) {
                    conf.ouPath += '?';
                    conf.ouPath += querystring.encode(args);
                }
                var session = new NodeRelaySession(conf);
                session.id = id;
                session.on('end', function (id) {
                    _this.dynamicSessions.delete(id);
                });
                this.dynamicSessions.set(id, session);
                session.run();
                Logger.log('[relay dynamic push] start id=' + id, conf.inPath, 'to', conf.ouPath);
            }
        }
    };
    NodeRelayServer.prototype.onDonePublish = function (id, streamPath, args) {
        var session = this.dynamicSessions.get(id);
        if (session) {
            session.end();
        }
        for (var _i = 0, _a = this.staticSessions.values(); _i < _a.length; _i++) {
            session = _a[_i];
            if (session.streamPath === streamPath) {
                session.end();
            }
        }
    };
    NodeRelayServer.prototype.stop = function () {
        clearInterval(this.staticCycle);
    };
    return NodeRelayServer;
}());
module.exports = NodeRelayServer;
