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

class NodeStreamServer extends EventEmitter {
    config: any
    streamSessions: any
    ws: WebSocket.Server

    constructor(config) {
        super()
        this.config = config
        this.streamSessions = new Map()
        this.ws = new WebSocket.Server({ port: 8080 })
    }

    async run() {
      // Check media root directory
      try {
        mkdirp.sync(this.config.http.mediaroot);
        fs.accessSync(this.config.http.mediaroot, fs.constants.W_OK);
      } catch (error) {
        Logger.error(`Node Media Stream Server startup failed. MediaRoot:${this.config.http.mediaroot} cannot be written.`);
        return;
      }

      // Check for ffmpeg & it's version
      try {
        fs.accessSync(this.config.stream.ffmpeg, fs.constants.X_OK);
      } catch (error) {
        Logger.error(`Node Media Stream Server startup failed. ffmpeg:${this.config.stream.ffmpeg} cannot be executed.`);
        return;
      }
      let version = await getFFmpegVersion(this.config.stream.ffmpeg);
      if (version === '' || parseInt(version.split('.')[0]) < 4) {
        Logger.error('Node Media Stream Server startup failed. ffmpeg requires version 4.0.0 above');
        Logger.error('Download the latest ffmpeg static program:', getFFmpegUrl());
        return;
      }
      
      // Log to console the media server tasks started
      let i = this.config.stream.tasks.length;
      let apps = '';
      while (i--) {
        apps += this.config.stream.tasks[i].app;
        apps += ' ';
      }
      Logger.log(`Node Media stream Server started for apps: [ ${apps}] , MediaRoot: ${this.config.http.mediaroot}, ffmpeg version: ${version}`);

      this.ws.on('connection', (ws: any, req: any) => {
        const streamPath = url.parse(req.url).pathname
        if (!streamPath) {
          Logger.error('Inncorrect Stream Path supplied on connection')
          return
        }
        let [app, name] = streamPath.split('/')

        let i = this.config.stream.tasks.length
        while (i--) {
          let conf = { ...this.config.stream.tasks[i] }
          conf.ffmpeg = this.config.stream.ffmpeg
          conf.mediaroot = this.config.http.mediaroot
          conf.rtmpPort = this.config.rtmp.port
          conf.streamPath = streamPath
          conf.streamApp = app
          conf.streamName = name
          if (app === conf.app) {
            const id = NodeCoreUtils.generateNewSessionID();
            let session = new NodeStreamSession(conf, id);
            this.streamSessions.set(id, session);

            session.on('data', millisecondsElapsed => {
              this.emit(`${codes.rtmp.data}`, millisecondsElapsed)
            })

            session.on('error', (err) => {
              this.emit(`${codes.rtmp.error}`)
            })

            session.on('end', (id) => {
              this.emit(`${codes.rtmp.finished}`)
              this.streamSessions.delete(id)
            })
            session.run()
          }
        }
      })
    }

    async onDonePublish(id, streamPath, args) {
        let session = this.streamSessions.get(id);
        if (session) {
            session.end();
        }
    }
}

export default NodeStreamServer
