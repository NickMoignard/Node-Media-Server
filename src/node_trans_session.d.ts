/// <reference types="node" />
export = NodeTransSession;
declare class NodeTransSession extends EventEmitter {
    constructor(conf: any);
    conf: any;
    run(): void;
    startTime: Date | undefined;
    ffmpeg_exec: import("child_process").ChildProcessWithoutNullStreams | undefined;
    processed(): void;
    end(): void;
}
import EventEmitter = require("events");
