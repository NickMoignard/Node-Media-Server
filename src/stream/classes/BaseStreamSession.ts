import { ChildProcess, spawn } from "child_process"
import EventEmitter from "events"
import WebSocket from "ws"
import Logger from '../../node_core_logger'
import { StreamConf } from "../../types"
import { CLIENT_ACTIONS } from "../../types/enums"

class BaseWSFFSession extends EventEmitter {
    ws: WebSocket
    ffmpeg_exec?: ChildProcess
    path?: string
    id: string
     
    constructor(id: string, ws: WebSocket) {
        super()
        this.ws = ws
        this.id = id
        this.addWebSocketEventListners()
    }
    run(ffmpegPath: string, argvList: string[], path: string) {
        this.ffmpeg_exec = spawn(ffmpegPath, argvList)
        this.addFfmpegEventListners()
    }
    addWebSocketEventListners(){
        // EVENT LISTENERS
        const websocketEventsMap = new Map<string, Function>([
          ['close', this.websocketClosedEventHandler],
          ['error', this.websocketErrorEventHandler],
          ['message', this.websocketMessageEventHandler],
          ['open', this.websocketOpenEventHandler],
          ['ping', this.websocketPingEventHandler],
          ['pong', this.websocketPongEventHandler],
          ['unexpected-response', this.websocketUnExpResEventHandler],
          ['upgrade', this.websocketUpgradeEventHandler],
        ])
        Object.keys(websocketEventsMap).forEach(key => this.ws.on(key, websocketEventsMap[key]))
      }
    websocketMessageEventHandler(data: Buffer | ArrayBuffer | Buffer[] | string, isBinary: boolean) {
    }
    websocketErrorEventHandler(error: Error) {
    }
    websocketClosedEventHandler(code: number, reason: Buffer) {
    }
    websocketOpenEventHandler() {
    }
    websocketPingEventHandler() {
    }
    websocketPongEventHandler() {
    }
    websocketUnExpResEventHandler() {
    }
    websocketUpgradeEventHandler() {
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

export default BaseWSFFSession