/// <reference types="node" />
import WebSocket from "ws";
import FfmpegProcess from "./FfmpegProcess";
/**
 * Ffmpeg Session with a websocket connection as input
 * @extends FfmpegProcess
 */
declare class BaseWebSocketSession extends FfmpegProcess {
    ws: WebSocket;
    start: Date;
    constructor(id: string, ws: WebSocket);
    addWebSocketEventListners(): void;
    websocketMessageEventHandler(_data: Buffer | ArrayBuffer | Buffer[] | string, _isBinary: boolean): void;
    websocketErrorEventHandler(_error: Error): void;
    websocketClosedEventHandler(_code: number, _reason: Buffer): void;
    websocketOpenEventHandler(): void;
    websocketPingEventHandler(): void;
    websocketPongEventHandler(): void;
    websocketUnExpResEventHandler(): void;
    websocketUpgradeEventHandler(): void;
}
export default BaseWebSocketSession;
