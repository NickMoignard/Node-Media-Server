/* eslint-disable no-unused-expressions */
import fs from 'fs'
import WebSocket from 'ws'
import mkdirp from 'mkdirp'
// import ArgvArray from "./helpers/classes/ArgvArray"F
import Logger from './node_core_logger'
import { StreamConf } from './types'
import { CLIENT_ACTIONS } from './types/enums'
import BaseWebSocketSession from './base_node_websocket_server'
import { WSHevcConfig } from './helpers/classes/wsToHlsFfmpegConf'

/**
 * Event emitting websocket stream session
 * @extends BaseWebSocketSession
 */
class WebSocketSession extends BaseWebSocketSession {
  conf: StreamConf

  argv: string[] // ArgvArray

  constructor(conf: StreamConf, id: string, ws: WebSocket) {
    super(id, ws)
    Logger.log('WebSocketSession constructor')
    this.conf = conf
    this.argv = new WSHevcConfig(this.conf.streamPath).args(conf.mediaroot)
    this.addWebSocketEventListners()
  }

  // Class Methods
  run() {
    // Check media root directory
    try {
      mkdirp.sync(
        `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`
      )
      fs.accessSync(
        `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`,
        fs.constants.W_OK
      )
      Logger.log(
        `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`
      )
    } catch (error) {
      Logger.error(
        `MediaRoot:${this.conf.mediaroot}/${this.conf.streamName} cannot be written.`
      )
      return
    }

    this.conf.streamPath &&
      super.run(this.conf.ffmpeg, this.argv, this.conf.streamPath)
    Logger.log('Web Socket Session Started')
  }

  pauseSession(): void {
    const temp = this.conf
  }

  unpauseSession(): void {
    const temp = this.conf
  }

  resetSession(): void {
    // look for files and delete / copy them
    const temp = this.conf
  }

  // Extend Web Socket Callbacks
  websocketMessageEventHandler(
    data: Buffer | ArrayBuffer | Buffer[] | string,
    isBinary: boolean
  ): void {
    super.websocketMessageEventHandler(data, isBinary)
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

  websocketErrorEventHandler(error: Error): void {
    super.websocketErrorEventHandler(error)
  }

  websocketClosedEventHandler(code: number, reason: Buffer): void {
    super.websocketClosedEventHandler(code, reason)
    this.stopFfmpeg()
  }
  // ffmpegCloseEventHandler(code) {
  //   super.ffmpegCloseEventHandler(code)
  // ws.terminate()
  // }

  addWebSocketEventListners(): void {
    // EVENT LISTENERS
    this.websocketClosedEventHandler =
      this.websocketClosedEventHandler.bind(this)
    this.ws.on('close', this.websocketClosedEventHandler)

    this.websocketErrorEventHandler = this.websocketErrorEventHandler.bind(this)
    this.ws.on('error', this.websocketErrorEventHandler)

    this.websocketMessageEventHandler =
      this.websocketMessageEventHandler.bind(this)
    this.ws.on('message', this.websocketMessageEventHandler)

    this.websocketOpenEventHandler = this.websocketOpenEventHandler.bind(this)
    this.ws.on('open', this.websocketOpenEventHandler)

    this.websocketPingEventHandler = this.websocketPingEventHandler.bind(this)
    this.ws.on('ping', this.websocketPingEventHandler)

    this.websocketPongEventHandler = this.websocketPongEventHandler.bind(this)
    this.ws.on('pong', this.websocketPongEventHandler)

    this.websocketUnExpResEventHandler =
      this.websocketUnExpResEventHandler.bind(this)
    this.ws.on('unexpected-response', this.websocketUnExpResEventHandler)

    this.websocketUpgradeEventHandler =
      this.websocketUpgradeEventHandler.bind(this)
    this.ws.on('upgrade', this.websocketUpgradeEventHandler)
  }
}

module.exports = WebSocketSession
export default WebSocketSession
