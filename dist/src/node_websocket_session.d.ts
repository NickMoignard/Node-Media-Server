/// <reference types="node" />
import WebSocket from "ws";
import ArgvArray from "./helpers/classes/ArgvArray";
import { StreamConf } from "./types";
import BaseWebSocketSession from "./base_node_websocket_server";
/**
 * Event emitting websocket stream session
 * @extends BaseWebSocketSession
 */
declare class WebSocketSession extends BaseWebSocketSession {
    conf: StreamConf;
    argv: ArgvArray;
    constructor(conf: StreamConf, id: string, ws: WebSocket);
    run(): void;
    pauseSession(): void;
    unpauseSession(): void;
    resetSession(): void;
    websocketMessageEventHandler(data: Buffer | ArrayBuffer | Buffer[] | string, isBinary: boolean): void;
    websocketErrorEventHandler(error: Error): void;
    websocketClosedEventHandler(code: number, reason: Buffer): void;
    addWebSocketEventListners(): void;
    wsToHLSFfArgs(_outpath: string): ArgvArray;
}
export default WebSocketSession;
