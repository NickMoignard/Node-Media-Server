/// <reference types="node" />
export = NodeRtmpServer;
declare class NodeRtmpServer {
    constructor(config: any);
    port: any;
    tcpServer: Net.Server;
    sslPort: any;
    tlsServer: Tls.Server | undefined;
    run(): void;
    stop(): void;
}
import Net = require("net");
import Tls = require("tls");
