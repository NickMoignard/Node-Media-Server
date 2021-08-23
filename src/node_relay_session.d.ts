/// <reference types="node" />
export = NodeRelaySession;
declare class NodeRelaySession extends EventEmitter {
    constructor(conf: any);
    conf: any;
    id: string;
    TAG: string;
    run(): void;
    ffmpeg_exec: import("child_process").ChildProcessWithoutNullStreams | undefined;
    end(): void;
}
import EventEmitter = require("events");
