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
        // this.addWebSocketEventListners()
        this.start = new Date()
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