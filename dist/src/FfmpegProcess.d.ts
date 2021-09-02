/// <reference types="node" />
import { ChildProcess } from 'child_process';
import EventEmitter from 'events';
declare class FfmpegProcess extends EventEmitter {
    ffmpeg_exec?: ChildProcess;
    path?: string;
    id: string;
    constructor(id: string);
    run(ffmpegPath: string, argvList: string[], _path: string): void;
    addFfmpegEventListners(): void;
    ffmpegErrorEventHandler(e: Error): void;
    ffmpegCloseEventHandler(_code: number, _signal: string): void;
    ffmpegSTDOUTErrorEventHandler(error: Error): void;
    ffmpegDataEventHandler(chunk: Buffer | string | any): void;
    stopFfmpeg(): void;
    addBufferToFfmpeg(buffer: Buffer): void;
}
export default FfmpegProcess;
