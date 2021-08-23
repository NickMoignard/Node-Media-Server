import { NodeMediaServerConfig } from "./types";
declare const NodeRtmpServer: any;
declare const NodeHttpServer: any;
declare const NodeTransServer: any;
declare const NodeRelayServer: any;
declare const NodeFissionServer: any;
declare const WebSocketStreamServer: any;
declare class NodeMediaServer {
    config: NodeMediaServerConfig;
    nrs: typeof NodeRtmpServer;
    nhs: typeof NodeHttpServer;
    nss: typeof WebSocketStreamServer;
    nts: typeof NodeTransServer;
    nls: typeof NodeRelayServer;
    nfs: typeof NodeFissionServer;
    constructor(config: NodeMediaServerConfig);
    run(): void;
    on(eventName: string, listener: Function): void;
    stop(): void;
    getSession(id: string): any;
}
export default NodeMediaServer;
