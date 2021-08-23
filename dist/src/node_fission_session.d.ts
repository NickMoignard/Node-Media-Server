/// <reference types="node" />
export = NodeFissionSession;
declare class NodeFissionSession extends EventEmitter {
    constructor(conf: any);
    conf: any;
    run(): void;
    ffmpeg_exec: import("child_process").ChildProcessWithoutNullStreams;
    end(): void;
}
import EventEmitter = require("events");
