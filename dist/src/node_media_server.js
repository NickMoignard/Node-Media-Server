"use strict";
//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
Object.defineProperty(exports, "__esModule", { value: true });
var enums_1 = require("./types/enums");
// const Https = require('https');
var Logger = require('./node_core_logger.js');
var NodeRtmpServer = require('./node_rtmp_server');
var NodeHttpServer = require('./node_http_server');
var NodeTransServer = require('./node_trans_server');
var NodeRelayServer = require('./node_relay_server');
var NodeFissionServer = require('./node_fission_server');
var WebSocketStreamServer = require('./node_websocket_server');
var context = require('./node_core_ctx');
var NodeMediaServer = /** @class */ (function () {
    function NodeMediaServer(config) {
        this.config = config;
    }
    NodeMediaServer.prototype.run = function () {
        Logger.setLogType(this.config.logType);
        if (this.config.rtmp) {
            this.nrs = new NodeRtmpServer(this.config);
            this.nrs.run();
        }
        if (this.config.http) {
            this.nhs = new NodeHttpServer(this.config);
            this.nhs.run();
        }
        if (this.config.stream) {
            this.nss = new WebSocketStreamServer(this.config);
            if (!this.nss) {
                Logger.log('Node Stream Server could not start');
            }
            this.nss.on(enums_1.HLS_CODES.data.toString(), function (_timeElapsed) {
                // TODO
            });
            this.nss.on(enums_1.HLS_CODES.error.toString(), function (_err) {
                // TODO
            });
            this.nss.on(enums_1.HLS_CODES.finished.toString(), function (_id) {
                // TODO
            });
        }
        if (this.config.trans) {
            if (this.config.cluster) {
                Logger.log('NodeTransServer does not work in cluster mode');
            }
            else {
                this.nts = new NodeTransServer(this.config);
                this.nts.run();
                this.nts.on('ffdata', function (_data) {
                    Logger.log('ffData');
                });
                this.nts.on('fferror', function (_data) {
                    Logger.log('ffError');
                });
                this.nts.on('ffend', function (_data) {
                    Logger.log('ffEnd');
                });
            }
        }
        if (this.config.relay) {
            if (this.config.cluster) {
                Logger.log('NodeRelayServer does not work in cluster mode');
            }
            else {
                this.nls = new NodeRelayServer(this.config);
                this.nls.run();
            }
        }
        if (this.config.fission) {
            if (this.config.cluster) {
                Logger.log('NodeFissionServer does not work in cluster mode');
            }
            else {
                this.nfs = new NodeFissionServer(this.config);
                this.nfs.run();
            }
        }
        process.on('uncaughtException', function (err) {
            Logger.error('uncaughtException', err);
        });
        process.on('SIGINT', function () {
            process.exit();
        });
    };
    NodeMediaServer.prototype.on = function (eventName, listener) {
        context.nodeEvent.on(eventName, listener);
    };
    NodeMediaServer.prototype.stop = function () {
        if (this.nrs) {
            this.nrs.stop();
        }
        if (this.nhs) {
            this.nhs.stop();
        }
        if (this.nls) {
            this.nls.stop();
        }
        if (this.nfs) {
            this.nfs.stop();
        }
        if (this.nss) {
            this.nss.stop();
        }
    };
    NodeMediaServer.prototype.getSession = function (id) {
        return context.sessions.get(id);
    };
    return NodeMediaServer;
}());
module.exports = NodeMediaServer;
exports.default = NodeMediaServer;
