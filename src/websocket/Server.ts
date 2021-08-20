import Logger from "../node_core_logger"
import WebSocketSession from "./Session"
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
import { NodeMediaServerConfig, StreamConf } from "../types";
import { HLS_CODES } from "../types/enums"

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

    // add event listeners
    const serverEventsMap = new Map<string, (...args: any[]) => void>([
      ['connection', this.connection],
      ['error', this.error],
      ['headers', this.headers],
      ['close', this.close]
    ])
    Object.keys(serverEventsMap).forEach(key =>
       this.wsServer.on(key, serverEventsMap.get(key) as (...args: any[]) => void)
    )
  }

  connection(ws: WebSocket, req: http.IncomingMessage) {
    if (!req.url) return

    const streamPath = url.parse(req.url).pathname
    
    if (!streamPath) {
      Logger.error('Inncorrect Stream Path supplied on connection')
      return
    }
    
    let [app, name] = streamPath.split('/')

    if (!this.config.stream?.ffmpeg || !this.config.stream?.mediaroot) { 
      throw new Error(`Couldn't record stream. Check mediaroot and ffmpeg path`)
    }
    
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
        ['data', (millisecondsElapsed: number) => {
          this.emit(HLS_CODES.data.toString(), millisecondsElapsed)
        }],
        ['error', (err: Error) => {
          this.emit(`${HLS_CODES.error}`)
        }],
        ['end', (id: string) => {
          this.emit(`${HLS_CODES.finished}`)
          this.streamSessions.delete(id)
        }]
      ])
      Object.keys(sessionEventsMap).forEach(
        key => session.on(key, sessionEventsMap.get(key) as (...args: any[]) => void)
      )

      session.run()
    }
  }

  error(error: Error) {
    Logger.error(`Web Socket Server Error Event: ${error.message}`)
  }
  headers(headers: Array<any>, req: http.IncomingMessage) {
    // nothing atm
  }
  close() {
    Object.keys(this.streamSessions).forEach(key => {
      const session = this.streamSessions.get(key)
      session && session.stopFfmpeg()
    })
  }
  listening() {
    Logger.log(`WebSocket Server listening at: ${this.wsServer.address()}`)
  }
}

export default WebSocketStreamServer
