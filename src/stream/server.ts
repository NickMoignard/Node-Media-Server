import Logger from "../node_core_logger"
import NodeStreamSession from "./session";
import { getFFmpegVersion, getFFmpegUrl } from "../node_core_utils"
import context from "../node_core_ctx"
import fs from "fs"
import * as _ from "lodash"
import mkdirp from "mkdirp"
import EventEmitter from "events"
import { WS_CODES as codes } from "./Codes"
import WebSocket from "ws"
import url from "url"
import NodeCoreUtils from "../node_core_utils"
import http from "http"
import { NodeMediaServerConfig, StreamConf } from "../types";

type SessionObjects = {
  websocket: WebSocket,
  session: NodeStreamSession
}
class NodeStreamServer extends EventEmitter {
  config: NodeMediaServerConfig 
  streamSessions: Map<string, SessionObjects>
  ws: WebSocket.Server

  constructor(config) {
    super()
    if (!config.stream) throw new Error('Incorrect Stream Config')
    this.config = config
    this.streamSessions = new Map()
    this.ws = new WebSocket.Server({ port: 8080 })

    // Check media root directory
    try {
      mkdirp.sync(config.stream.mediaroot);
      fs.accessSync(config.stream.mediaroot, fs.constants.W_OK);
    } catch (error) {
      Logger.error(`Node Media Stream Server startup failed. MediaRoot:${config.stream.mediaroot} cannot be written.`);
      return;
    }

    // Check for ffmpeg
    try {
      fs.accessSync(config.stream.ffmpeg, fs.constants.X_OK);
    } catch (error) {
      Logger.error(`Node Media Stream Server startup failed. ffmpeg:${config.stream.ffmpeg} cannot be executed.`);
      return;
    }

    // Log to console the media server tasks started
    let i = config.stream.tasks.length;
    let apps = '';
    while (i--) {
      apps += config.stream.tasks[i].app;
      apps += ' ';
    }
    Logger.log(`Node Media Stream Server started for apps: [ ${apps}] , MediaRoot: ${config.http.mediaroot}`);

    // add event listeners
    const serverEventsMap = new Map<string, Function>([
      ['connection', this.connection],
      ['error', this.error],
      ['headers', this.headers],
      ['close', this.close]
    ])
    Object.keys(serverEventsMap).forEach(key => this.ws.on(key, serverEventsMap[key]))
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
      const id = streamPath;
      let session = new NodeStreamSession(conf, id, ws);
      this.streamSessions.set(id, {
        session: session,
        websocket: ws
      });
      
      const sessionEventsMap = new Map<string, Function>([
        ['data', (millisecondsElapsed) => {
          this.emit(codes.hls.data.toString(), millisecondsElapsed)
        }],
        ['error', (err) => {
          this.emit(`${codes.hls.error}`)
        }],
        ['end', (id) => {
          this.emit(`${codes.hls.finished}`)
          this.streamSessions.delete(id)
        }]
      ])
      Object.keys(sessionEventsMap).forEach(key => session.on(key, sessionEventsMap[key]))

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
    this.streamSessions.forEach(session => session.end())
  }
  listening() {
    Logger.log(`WebSocket Server listening at: ${this.ws.address()}`)
  }
}

export default NodeStreamServer
