import { ChildProcess, spawn } from "child_process"
import fs from "fs"
import EventEmitter from "events"
import Logger from '../node_core_logger'
import ArgvArray from "./classes/ArgvArray"
import { nmsAuthParam } from "../helpers/auth"


type NodeStreamSessionConf = {
  ffmpeg: string,
  mediaroot: string,
  rtmpPort: string | number,
  streamPath: string,
  streamName: string,
  streamApp?: string,
  app?: string,
  args?: string | string[],
  hls?: boolean,
  hlsFlags?: string
}

class NodeStreamSession extends EventEmitter {
    conf: NodeStreamSessionConf
    ffmpeg_exec?: ChildProcess
    id: any
    
    constructor (conf: NodeStreamSessionConf, id: any) {
        super()
        this.conf = conf
        this.id = id
    }
    run() {

      const rtmpUrl = `rtmp://localhost:1935${this.conf.streamPath}${nmsAuthParam(this.conf.streamPath)}`
        const outPath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`


        let argv = new ArgvArray(['-y']) // Overwrite output files without asking.
        
        // no input path. we will manually add data to ffmpeg process
        argv.add(['-i', '-'])

        // video codec config: low latency, adaptive bitrate
        argv.add(['-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency'])

        // audio codec config: sampling frequency (11025, 22050, 44100), bitrate 64 kbits
        argv.add(['-c:a', 'aac', '-strict', '-2', '-ar', '44100', '-b:a', '64k'])

        // audio sync
        argv.add(['-use_wallclock_as_timestamps', '1','-async', '1'])

        // buffer size
        argv.add(['-bufsize', '1000'])

        argv.add(['-f', 'flv', rtmpUrl])
    
        // hls
        // argv.add(["-f", "hls"])
        // argv.add(["-hls_time", "2"])
        // argv.add(["-hls_flags", "independant_segments"])
        // argv.add(["-hls_segment_type", "mpegts"])
        // argv.add(["-hls_list_size", "6900"])
        // argv.add(["-hls_segment_filename", "stream_%v/data%02d.ts"])
        // argv.add(["-master_pl_name", "master.m3u8"])
        // argv.add(["-var_stream_map", '"v:0,a:0 v:1,a:1 v:2,a:2" stream_%v.m3u8'])

        this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv.list)

        this.ffmpeg_exec && this.ffmpeg_exec.on('error', (e) => {
            Logger.ffdebug(e)
        });
      
        this.ffmpeg_exec.stdout && this.ffmpeg_exec.stdout.on('data', (data) => {
            Logger.ffdebug(`FFout：${data}`)
        });
      
        this.ffmpeg_exec.stderr && this.ffmpeg_exec.stderr.on('data', (data) => {
            Logger.ffdebug(`FFerr：${data}`)
        });
      
        this.ffmpeg_exec.on('close', (code) => {
          Logger.log('[Transmuxing end] ' + this.conf.streamPath);
          this.emit('end', this.id);
          fs.readdir(outPath, function (err, files) {
            if (!err) {
              files.forEach((filename) => {
                if (
                  filename.endsWith('.ts') ||
                  filename.endsWith('.m3u8') ||
                  filename.endsWith('.mpd') ||
                  filename.endsWith('.m4s') ||
                  filename.endsWith('.tmp')
                ) {
                  fs.unlinkSync(outPath + '/' + filename);
                }
              });
            }
          });
        });

    }

    addBuffer(buffer: Buffer) {
      if (this.ffmpeg_exec) {
        this.ffmpeg_exec.stdin && this.ffmpeg_exec.stdin.write(buffer)
      } else {
        throw new Error('FFMPEG process cannot be found!')
      }
    }

    end() {
      this.ffmpeg_exec && this.ffmpeg_exec.kill()
    }


}

export default NodeStreamSession
