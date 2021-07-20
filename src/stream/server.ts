import Logger from "../node_core_logger"
import NodeStreamSession from "./session";
import { getFFmpegVersion, getFFmpegUrl } from "../node_core_utils"
import context from "../node_core_ctx"
import fs from "fs"
import * as _ from "lodash"
import mkdirp from "mkdirp"

class NodeStreamServer {
    config: any
    streamSessions: any

    constructor(config) {
        this.config = config
        this.streamSessions = new Map()
    }

    async run() {
        try {
            mkdirp.sync(this.config.http.mediaroot);
            fs.accessSync(this.config.http.mediaroot, fs.constants.W_OK);
          } catch (error) {
            Logger.error(`Node Media Stream Server startup failed. MediaRoot:${this.config.http.mediaroot} cannot be written.`);
            return;
          }
      
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
      
          let i = this.config.stream.tasks.length;
          let apps = '';
          while (i--) {
            apps += this.config.stream.tasks[i].app;
            apps += ' ';
          }
          context.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
          context.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
          Logger.log(`Node Media stream Server started for apps: [ ${apps}] , MediaRoot: ${this.config.http.mediaroot}, ffmpeg version: ${version}`);
    }

    async onPostPublish(id, streamPath, args) {
        let regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
        let [app, name] = _.slice(regRes, 1);
        let i = this.config.stream.tasks.length;
        while (i--) {
          let conf = { ...this.config.stream.tasks[i] };
          conf.ffmpeg = this.config.stream.ffmpeg;
          conf.mediaroot = this.config.http.mediaroot;
          conf.rtmpPort = this.config.rtmp.port;
          conf.streamPath = streamPath;
          conf.streamApp = app;
          conf.streamName = name;
          conf.args = args;
          if (app === conf.app) {
            let session = new NodeStreamSession(conf);
            this.streamSessions.set(id, session);
            session.on('end', () => {
              this.streamSessions.delete(id);
            });
            session.run();
          }
        }
    }
    async onDonePublish(id, streamPath, args) {
        let session = this.streamSessions.get(id);
        if (session) {
            session.end();
        }
    }
}

export default NodeStreamServer
