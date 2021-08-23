export = NodeFissionServer;
declare class NodeFissionServer {
    constructor(config: any);
    config: any;
    fissionSessions: Map<any, any>;
    run(): Promise<void>;
    onPostPublish(id: any, streamPath: any, args: any): void;
    onDonePublish(id: any, streamPath: any, args: any): void;
}
