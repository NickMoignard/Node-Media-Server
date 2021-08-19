//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

const Https = require('https');
const Logger = require('./node_core_logger');
const NodeRtmpServer = require('./node_rtmp_server');
const NodeHttpServer = require('./node_http_server');
const NodeTransServer = require('./node_trans_server');
const NodeRelayServer = require('./node_relay_server');
const NodeFissionServer = require('./node_fission_server');
const NodeStreamServer = require('./websocket/Server')
const context = require('./node_core_ctx');


class NodeMediaServer {
  constructor(config) {
    this.config = config;
  }

  run() {
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
      this.nss = new NodeStreamServer(this.config);
      this.nss.on(codes.hls.data.toString(), timeElapsed => {
        // TODO
      })
      this.nss.on(codes.hls.error.toString(), err => {
        // TODO
      })
      this.nss.on(codes.hls.finished.toString(), id => {
        // TODO
      })
    }
    
    if (this.config.trans) {
      if (this.config.cluster) {
        Logger.log('NodeTransServer does not work in cluster mode');
      } else {
        this.nts = new NodeTransServer(this.config);
        this.nts.run();
        this.nts.on('ffdata', (data) => {
          Logger.log('ffData');
        });
        this.nts.on('fferror', (data) => {
          Logger.log('ffError');
        });
        this.nts.on('ffend', (data) => {
          Logger.log('ffEnd');
        });
      }
    }

    if (this.config.relay) {
      if (this.config.cluster) {
        Logger.log('NodeRelayServer does not work in cluster mode');
      } else {
        this.nls = new NodeRelayServer(this.config);
        this.nls.run();
      }
    }

    if (this.config.fission) {
      if (this.config.cluster) {
        Logger.log('NodeFissionServer does not work in cluster mode');
      } else {
        this.nfs = new NodeFissionServer(this.config);
        this.nfs.run();
      }
    }

    process.on('uncaughtException', function (err) {
      Logger.error('uncaughtException', err);
    });

    process.on('SIGINT', function() {
      process.exit();
    });
  }

  on(eventName, listener) {
    context.nodeEvent.on(eventName, listener);
  }

  stop() {
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
  }

  getSession(id) {
    return context.sessions.get(id);
  }
}

module.exports = NodeMediaServer;