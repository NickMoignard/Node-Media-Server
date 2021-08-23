//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

import { NodeMediaServerConfig } from "./types";
import { HLS_CODES } from "./types/enums";

// const Https = require('https');
const Logger = require('./node_core_logger.js');
const NodeRtmpServer = require('./node_rtmp_server');
const NodeHttpServer = require('./node_http_server');
const NodeTransServer = require('./node_trans_server');
const NodeRelayServer = require('./node_relay_server');
const NodeFissionServer = require('./node_fission_server');
const WebSocketStreamServer = require('./node_websocket_server');
const context = require('./node_core_ctx');


class NodeMediaServer {
  config: NodeMediaServerConfig
  nrs: typeof NodeRtmpServer
  nhs: typeof NodeHttpServer
  nss: typeof WebSocketStreamServer
  nts: typeof NodeTransServer
  nls: typeof NodeRelayServer
  nfs: typeof NodeFissionServer

  constructor(config: NodeMediaServerConfig) {
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
      this.nss = new WebSocketStreamServer(this.config);
      if (!this.nss) {
        Logger.log('Node Stream Server could not start')
      }
      this.nss.on(HLS_CODES.data.toString(), (_timeElapsed: number) => {
        // TODO
      })
      this.nss.on(HLS_CODES.error.toString(), (_err: Error) => {
        // TODO
      })
      this.nss.on(HLS_CODES.finished.toString(), (_id: string) => {
        // TODO
      })
    }
    
    if (this.config.trans) {
      if (this.config.cluster) {
        Logger.log('NodeTransServer does not work in cluster mode');
      } else {
        this.nts = new NodeTransServer(this.config);
        this.nts.run();
        this.nts.on('ffdata', (_data: any) => {
          Logger.log('ffData');
        });
        this.nts.on('fferror', (_data: any) => {
          Logger.log('ffError');
        });
        this.nts.on('ffend', (_data: any) => {
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

  on(eventName: string, listener: Function) {
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

  getSession(id: string) {
    return context.sessions.get(id);
  }
}

module.exports = NodeMediaServer;
export default NodeMediaServer