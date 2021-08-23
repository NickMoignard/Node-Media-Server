/// <reference types="node" />
export = NodeFlvSession;
declare class NodeFlvSession {
    static createFlvTag(packet: any): Buffer;
    constructor(config: any, req: any, res: any);
    config: any;
    req: any;
    res: any;
    id: string;
    ip: any;
    playStreamPath: string;
    playArgs: import("querystring").ParsedUrlQuery | null;
    isStarting: boolean;
    isPlaying: boolean;
    isIdling: boolean;
    TAG: string;
    numPlayCache: number;
    run(): void;
    connectCmdObj: {
        ip: any;
        method: any;
        streamPath: string;
        query: import("querystring").ParsedUrlQuery;
    } | undefined;
    connectTime: Date | undefined;
    stop(): void;
    onReqClose(): void;
    onReqError(e: any): void;
    reject(): void;
    onPlay(): void;
    onStartPlay(): void;
}
