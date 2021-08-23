export = NodeTransServer;
declare class NodeTransServer {
    constructor(config: any);
    config: any;
    transSessions: Map<any, any>;
    run(): Promise<void>;
    onPostPublish(id: any, streamPath: any, args: any): void;
    onDonePublish(id: any, streamPath: any, args: any): void;
}
