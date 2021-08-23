// import { ChildProcess, spawn } from "child_process"
// import EventEmitter from "events"
import WebSocket from "ws"
// import Logger from '../node_core_logger'
// import { StreamConf } from "../types"
// import { CLIENT_ACTIONS } from "../types/enums"
import FfmpegProcess from "./FfmpegProcess"


/**
 * Ffmpeg Session with a websocket connection as input
 * @extends FfmpegProcess
 */
class BaseWebSocketSession extends FfmpegProcess {
    ws: WebSocket
    start: Date

    constructor(id: string, ws: WebSocket) {
        super(id)
        this.ws = ws
        this.addWebSocketEventListners()
        this.start = new Date()
    }

    addWebSocketEventListners(){
        // EVENT LISTENERS
        const websocketEventsMap = new Map<string, (...args: any[]) => void>([
          ['close', this.websocketClosedEventHandler],
          ['error', this.websocketErrorEventHandler],
          ['message', this.websocketMessageEventHandler],
          ['open', this.websocketOpenEventHandler],
          ['ping', this.websocketPingEventHandler],
          ['pong', this.websocketPongEventHandler],
          ['unexpected-response', this.websocketUnExpResEventHandler],
          ['upgrade', this.websocketUpgradeEventHandler],
        ])
        
        Object.keys(websocketEventsMap).forEach(key => { 
          const func = websocketEventsMap.get(key) as (...args: any[]) => void
          this.ws.on(key, func)
        })
      }
    websocketMessageEventHandler(_data: Buffer | ArrayBuffer | Buffer[] | string, _isBinary: boolean) {
      this.emit('data', new Date().valueOf() - this.start.valueOf())
    }
    websocketErrorEventHandler(_error: Error) {
    }
    websocketClosedEventHandler(_code: number, _reason: Buffer) {
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