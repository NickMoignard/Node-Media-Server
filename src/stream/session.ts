import { spawn } from "child_process"
import fs from "fs"
import EventEmitter from "events"
import Logger from '../node_core_logger'
import { ArgvArray } from "./classes"
import FilterComplexConfig from "./classes/filterComplexConfig"


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


        let argv = new ArgvArray(['-y']) // Overwrite output files without asking.

        // inPath
        const inputPath =  `rtmp://127.0.0.1:${this.conf.rtmpPort}${this.conf.streamPath}`
        argv.add(['-i', inputPath])


        // Split input video into multiple versions
        argv.add(filterConf.filterComplexArgs())

        // configure each video output
        filterConf.versions.forEach((vers, i) => {
            argv.add(vers.vidOutputArgs(i))
        })

        // configure each audio output
        filterConf.versions.forEach((vers, i) => {
            argv.add(vers.aOutputArgs(i))
        })
        
        // hls
        argv.add(["-f", "hls"])
        argv.add(["-hls_time", "2"])
        argv.add(["-hls_flags", "independant_segments"])
        argv.add(["-hls_segment_type", "mpegts"])
        argv.add(["-hls_list_size", "6900"])
        argv.add(["-hls_segment_filename", "stream_%v/data%02d.ts"])
        argv.add(["-master_pl_name", "master.m3u8"])
        argv.add(["-var_stream_map", '"v:0,a:0 v:1,a:1 v:2,a:2" stream_%v.m3u8'])


        this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv.list)

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
