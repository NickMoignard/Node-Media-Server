import { spawn } from "child_process"
import fs from "fs"
import EventEmitter from "events"
import Logger from '../node_core_logger'
import { ArgvArray } from "./classes"
import FilterComplexConfig from "./classes/filterComplexConfig"
import { ffArgvHelper } from "./ffHelper"


class NodeStreamSession extends EventEmitter {
    conf: any
    ffmpeg_exec: any
    
    constructor (conf) {
        super()
        this.conf = conf
    }
    run() {
        // use standard filter complex to split the video
        const filterConf = new FilterComplexConfig()
        const outPath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`

        const argv = ffArgvHelper(this.conf, filterConf)


        this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv)

        this.ffmpeg_exec.on('error', (e) => {
            Logger.ffdebug(e);
        });
      
        this.ffmpeg_exec.stdout.on('data', (data) => {
            Logger.ffdebug(`FF输出：${data}`);
        });
      
        this.ffmpeg_exec.stderr.on('data', (data) => {
            Logger.ffdebug(`FF输出：${data}`);
        });
      
        this.ffmpeg_exec.on('close', (code) => {
        Logger.log('[Transmuxing end] ' + this.conf.streamPath);
        this.emit('end');
          fs.readdir(outPath, function (err, files) {
            if (!err) {
              files.forEach((filename) => {
                if (filename.endsWith('.ts')
                  || filename.endsWith('.m3u8')
                  || filename.endsWith('.mpd')
                  || filename.endsWith('.m4s')
                  || filename.endsWith('.tmp')) {
                    fs.unlinkSync(outPath + '/' + filename);
                  }
                });
              }
            });
          });

    }

    end() {
      this.ffmpeg_exec.kill()
    }
    
}

export default NodeStreamSession
