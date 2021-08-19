import { ChildProcess, spawn } from "child_process"
import EventEmitter from "events"
import WebSocket from "ws"
import Logger from '../node_core_logger'
import { StreamConf } from "../types"
import { CLIENT_ACTIONS } from "../types/enums"
import FfmpegProcess from "../FfmpegProcess"


/**
 * Ffmpeg Session with a websocket connection as input
 * @extends EventEmitter
 */
class BaseWebSocketSession extends FfmpegProcess {
    ws: WebSocket

    constructor(id: string, ws: WebSocket) {
        super(id)
        this.ws = ws
        this.addWebSocketEventListners()
    }

    addWebSocketEventListners(){
        // EVENT LISTENERS
        const websocketEventsMap = new Map<string, Function>([
          ['close', this.websocketClosedEventHandler],
          ['error', this.websocketErrorEventHandler],
          ['message', this.websocketMessageEventHandler],
          ['open', this.websocketOpenEventHandler],
          ['ping', this.websocketPingEventHandler],
          ['pong', this.websocketPongEventHandler],
          ['unexpected-response', this.websocketUnExpResEventHandler],
          ['upgrade', this.websocketUpgradeEventHandler],
        ])
        Object.keys(websocketEventsMap).forEach(key => this.ws.on(key, websocketEventsMap[key]))
      }
    websocketMessageEventHandler(data: Buffer | ArrayBuffer | Buffer[] | string, isBinary: boolean) {
    }
    websocketErrorEventHandler(error: Error) {
    }
    websocketClosedEventHandler(code: number, reason: Buffer) {
    }
    websocketOpenEventHandler() {
    }
    websocketPingEventHandler() {
    }
    websocketPongEventHandler() {
    }
    websocketUnExpResEventHandler() {
    }
    websocketUpgradeEventHandler() {
    }
}

export default BaseWebSocketSession