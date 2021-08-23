export = NodeRelayServer;
declare class NodeRelayServer {
    constructor(config: any);
    config: any;
    staticCycle: NodeJS.Timer;
    staticSessions: Map<any, any>;
    dynamicSessions: Map<any, any>;
    run(): Promise<void>;
    onStatic(): void;
    onRelayPull(url: any, app: any, name: any): string;
    onRelayPush(url: any, app: any, name: any): void;
    onPrePlay(id: any, streamPath: any, args: any): void;
    onDonePlay(id: any, streamPath: any, args: any): void;
    onPostPublish(id: any, streamPath: any, args: any): void;
    onDonePublish(id: any, streamPath: any, args: any): void;
    stop(): void;
}
