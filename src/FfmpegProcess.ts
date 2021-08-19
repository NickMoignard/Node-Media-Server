import { ChildProcess, spawn } from "child_process"
import EventEmitter from "events"
import Logger from './node_core_logger'
import { StreamConf } from "./types"
import { CLIENT_ACTIONS } from "./types/enums"

class FfmpegProcess extends EventEmitter {
    ffmpeg_exec?: ChildProcess
    path?: string
    id: string
    constructor(id: string,) {
        super()
        this.id = id
    }
    run(ffmpegPath: string, argvList: string[], path: string) {
        this.ffmpeg_exec = spawn(ffmpegPath, argvList)
        this.addFfmpegEventListners()
    }
    addFfmpegEventListners() {
        if (this.ffmpeg_exec) {
          // FFMPEG STDOUT EVENTS
          this.ffmpeg_exec.stdout &&
              this.ffmpeg_exec.stdout.on('data', this.ffmpegDataEventHandler)
              
          // FFMPEG STDERR EVENTS
          this.ffmpeg_exec.stderr &&
              this.ffmpeg_exec.stderr.on('data', this.ffmpegSTDOUTErrorEventHandler)
      
          // FFMPEG child process events
          const ffmpegEventsMap = new Map<string, Function>([
            ['close',this.ffmpegCloseEventHandler],
            ['error', this.ffmpegErrorEventHandler],
          ])
          Object.keys(ffmpegEventsMap).forEach(key => this.ffmpeg_exec && this.ffmpeg_exec.on(key, ffmpegEventsMap[key]))
        }
      }
      ffmpegErrorEventHandler(e) {
          Logger.ffdebug(e)
      }
      ffmpegCloseEventHandler(code) {
          Logger.log('[Transmuxing end] ' + this.path)
          this.emit('end', this.id)
      }
      ffmpegSTDOUTErrorEventHandler(data) {
          Logger.ffdebug(`FFerr：${data}`)
      }
      ffmpegDataEventHandler(data) {
          Logger.ffdebug(`FFout: ${data}`)
      }
      stopFfmpeg() {
        this.ffmpeg_exec && this.ffmpeg_exec.kill('SIGSTOP') // or "SIGINT" for keyboard interupt
      }
      addBufferToFfmpeg(buffer: Buffer) {
        if (this.ffmpeg_exec) {
          this.ffmpeg_exec.stdin && this.ffmpeg_exec.stdin.write(buffer)
        } else {
          throw new Error('FFMPEG process cannot be found!')
        }
      }
}

export default FfmpegProcess
