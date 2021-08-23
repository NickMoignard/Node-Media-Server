/// <reference types="node" />
import WebSocketSession from "./node_websocket_session";
import EventEmitter from "events";
import WebSocket from "ws";
import http from "http";
import { NodeMediaServerConfig } from "./types";
/**
 * Event emitting websocket stream server
 * @extends EventEmitter
 */
declare class WebSocketStreamServer extends EventEmitter {
    config: NodeMediaServerConfig;
    streamSessions: Map<string, WebSocketSession>;
    wsServer: WebSocket.Server;
    /**
     * Create a websocket stream server
     * @param {NodeMediaServerConfig} config - The configuration for server setup
     * @returns
     */
    constructor(config: NodeMediaServerConfig);
    connection(ws: WebSocket, req: http.IncomingMessage): void;
    error(error: Error): void;
    headers(_headers: Array<any>, _req: http.IncomingMessage): void;
    close(): void;
    listening(): void;
}
export default WebSocketStreamServer;
