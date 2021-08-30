import Logger from "./node_core_logger"
import WebSocketSession from "./node_websocket_session"
// import { getFFmpegVersion, getFFmpegUrl } from "../node_core_utils"
// import context from "../node_core_ctx"
import fs from "fs"
import * as _ from "lodash"
import mkdirp from "mkdirp"
import EventEmitter from "events"
import WebSocket from "ws"
import url from "url"
// import NodeCoreUtils from "../node_core_utils"
import http from "http"
import { NodeMediaServerConfig, StreamConf } from "./types";
import { HLS_CODES } from "./types/enums"

import WebSocketRTMPSession from "./node_websocket_rtmp_session"

const context = require('./node_core_ctx')
/**
 * Event emitting websocket stream server
 * @extends EventEmitter
 */
class WebSocketStreamServer extends EventEmitter {
  config: NodeMediaServerConfig 
  streamSessions: Map<string, WebSocketSession>
  wsServer: WebSocket.Server

// TODO: - add authentication to publish routes

  /**
   * Create a websocket stream server
   * @param {NodeMediaServerConfig} config - The configuration for server setup
   * @returns 
   */
  constructor(config: NodeMediaServerConfig) {
    super()
    Logger.log('Web Socket stream server started listening on 8080')
    if (!config.stream) throw new Error('Incorrect Stream Config')
    this.config = config
    this.streamSessions = new Map()
    this.wsServer = new WebSocket.Server({ port: 8080 })

    // Check media root directory
    try {
      mkdirp.sync(config.stream.mediaroot);
      fs.accessSync(config.stream.mediaroot, fs.constants.W_OK);
    } catch (error) {
      Logger.error(`Node Media Stream Server startup failed. MediaRoot:${config.stream.mediaroot} cannot be written.`)
      return
    }

    // Check for ffmpeg
    try {
      fs.accessSync(config.stream.ffmpeg, fs.constants.X_OK)
    } catch (error) {
      Logger.error(`Node Media Stream Server startup failed. ffmpeg:${config.stream.ffmpeg} cannot be executed.`)
      return
    }

    // // add event listeners
    // const serverEventsMap = new Map<string, (...args: any[]) => void>([
    //   ['connection', this.connection],
    //   ['error', this.error],
    //   ['headers', this.headers],
    //   ['close', this.close]
    // ])
    // Object.keys(serverEventsMap).forEach(key =>
    //    this.wsServer.on(key, serverEventsMap.get(key) as (...args: any[]) => void)
    // )
    this.connection = this.connection.bind(this)
    this.error = this.error.bind(this)
    this.headers = this.headers.bind(this)
    this.listening = this.listening.bind(this)

    this.wsServer.on('connection', this.connection)
    this.wsServer.on('error', this.error)
    this.wsServer.on('headers', this.headers)
    this.wsServer.on('listening', this.listening)
  }

  connection(ws: WebSocket, req: http.IncomingMessage) {
    if (!req.url) return
    const streamPath = url.parse(req.url).pathname
    
    if (!streamPath) {
      Logger.error('Inncorrect Stream Path supplied on connection')
      return
    }
    
    let [_, app, name] = streamPath.split('/')

    if (!this.config.stream?.ffmpeg || !this.config.stream?.mediaroot) { 
      throw new Error(`Couldn't record stream. Check mediaroot and ffmpeg path`)
    }
    if (!this.config) throw new Error('Config not set!')

    let conf = {
      ...this.config.stream,
      ffmpeg: this.config.stream?.ffmpeg,
      mediaroot: this.config.stream?.mediaroot,
      streamPath: streamPath,
      streamName: name,
      streamApp: app
    } as StreamConf

    if (app === conf.app) {
      const id = streamPath
      let session = new WebSocketSession(conf, id, ws)
      this.streamSessions.set(id, session)
      
      const sessionEventsMap = new Map<string, (...args: any[]) => void>([
        ['data', this.sessionData],
        ['error', this.sessionError],
        ['end', this.sessionEnd]
      ])

      this.sessionData = this.sessionData.bind(this)
      this.sessionError = this.sessionError.bind(this)
      this.sessionEnd = this.sessionEnd.bind(this)

      Object.keys(sessionEventsMap).forEach(
        key => {
          session.on(key, sessionEventsMap.get(key) as (...args: any[]) => void)
        }
      )

      session.run()
    }
  }
  sessionData(millisecondsElapsed: number) {
    this.emit(HLS_CODES.data.toString(), millisecondsElapsed)
  }
  sessionError(_err: Error) {
    this.emit(`${HLS_CODES.error}`)
  }
  sessionEnd(id: string) {
    this.emit(`${HLS_CODES.finished}`)
    this.streamSessions.delete(id)
  }

  error(error: Error) {
    Logger.error(`Web Socket Server Error Event: ${error.message}`)
  }
  headers(_headers: Array<any>, _req: http.IncomingMessage) {
    // nothing atm
  }
  close() {
    Object.keys(this.streamSessions).forEach(key => {
      const session = this.streamSessions.get(key)
      session && session.stopFfmpeg()
    })
  }
  listening() {
    if (this.wsServer) {
      Logger.log(`WebSocket Server listening at: ${this.wsServer.address()}`)
    }
    Logger.log('Websocket Listening Event triggered')
  }
}
module.exports = WebSocketStreamServer
export default WebSocketStreamServer
