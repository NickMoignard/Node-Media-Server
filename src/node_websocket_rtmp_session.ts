import WebSocket from "ws"
import ArgvArray from "./helpers/classes/ArgvArray"
import Logger from "./node_core_logger"
import { StreamConf } from "./types"
import { CLIENT_ACTIONS } from "./types/enums"
import BaseWebSocketSession from "./base_node_websocket_server"
import fs from "fs"
import { rtmpHevcConfig, WStoRTMPcConfig } from "./helpers/classes/wsToHlsFfmpegConf"
import mkdirp from "mkdirp"



/**
 * Event emitting websocket stream session
 * @extends BaseWebSocketSession
 */
class WebSocketRTMPSession extends BaseWebSocketSession {
  conf: StreamConf
  argv: string[] // ArgvArray
  
  constructor (conf: StreamConf, id: string, ws: WebSocket) {
    super(id, ws)
    Logger.log('WebSocketSession constructor')
    this.conf = conf
    this.argv = new WStoRTMPcConfig(this.conf.streamPath).args()
    this.addWebSocketEventListners()
  }

  // Class Methods
  run() {
    this.conf.streamPath && super.run(this.conf.ffmpeg, this.argv , this.conf.streamPath);
    Logger.log('Web Socket Session Started')
  }
  pauseSession() {
  }
  unpauseSession() {
  }
  resetSession() {
    // look for files and delete / copy them
  }

  // Extend Web Socket Callbacks
  websocketMessageEventHandler(data: Buffer | ArrayBuffer | Buffer[] | string, isBinary: boolean) {
    super.websocketMessageEventHandler(data, isBinary);
    switch (data) {
      case CLIENT_ACTIONS.startRec:
        this.run()
        break
      case CLIENT_ACTIONS.stopRec:
        this.stopFfmpeg()
        // respond with stop OK
        break
      case CLIENT_ACTIONS.resetRect:
        this.resetSession()
        break
      case CLIENT_ACTIONS.unpauseRec:
        this.unpauseSession()
        break
      case CLIENT_ACTIONS.pauseRec:
        // respond with OK
        this.pauseSession()
        break
      default:
        if (Buffer.isBuffer(data)) {
          // get session
          this.addBufferToFfmpeg(data)
        }
        break
    }
  }
  websocketErrorEventHandler(error: Error) {
    super.websocketErrorEventHandler(error)
  }
  websocketClosedEventHandler(code: number, reason: Buffer) {
    super.websocketClosedEventHandler(code, reason)
    this.stopFfmpeg()
  }
  // ffmpegCloseEventHandler(code) {
  //   super.ffmpegCloseEventHandler(code)
    // ws.terminate()
  // }

  addWebSocketEventListners(){
    // EVENT LISTENERS
    this.websocketClosedEventHandler = this.websocketClosedEventHandler.bind(this)
    this.ws.on('close', this.websocketClosedEventHandler)

    this.websocketErrorEventHandler = this.websocketErrorEventHandler.bind(this)
    this.ws.on('error', this.websocketErrorEventHandler)

    this.websocketMessageEventHandler = this.websocketMessageEventHandler.bind(this)
    this.ws.on('message', this.websocketMessageEventHandler)

    this.websocketOpenEventHandler = this.websocketOpenEventHandler.bind(this)
    this.ws.on('open', this.websocketOpenEventHandler)

    this.websocketPingEventHandler = this.websocketPingEventHandler.bind(this)
    this.ws.on('ping', this.websocketPingEventHandler)

    this.websocketPongEventHandler = this.websocketPongEventHandler.bind(this)
    this.ws.on('pong', this.websocketPongEventHandler)

    this.websocketUnExpResEventHandler = this.websocketUnExpResEventHandler.bind(this)
    this.ws.on('unexpected-response', this.websocketUnExpResEventHandler)

    this.websocketUpgradeEventHandler = this.websocketUpgradeEventHandler.bind(this)
    this.ws.on('upgrade', this.websocketUpgradeEventHandler)
  }
}

module.exports = WebSocketRTMPSession
export default WebSocketRTMPSession
