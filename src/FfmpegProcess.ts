/* eslint-disable no-debugger */
/* eslint-disable camelcase */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-unused-expressions */
import { ChildProcess, spawn } from 'child_process'
import EventEmitter from 'events'
import Logger from './node_core_logger'
// import { StreamConf } from "./types"
// import { CLIENT_ACTIONS } from "./types/enums"

class FfmpegProcess extends EventEmitter {
  ffmpeg_exec?: ChildProcess

  path?: string

  id: string

  constructor(id: string) {
    super()
    this.id = id
  }

  run(ffmpegPath: string, argvList: string[], _path: string) {
    Logger.log(argvList.join(' '))
    this.ffmpeg_exec = spawn(ffmpegPath, argvList)
    this.addFfmpegEventListners()
  }

  addFfmpegEventListners() {
    this.ffmpegCloseEventHandler = this.ffmpegCloseEventHandler.bind(this)
    this.ffmpegDataEventHandler = this.ffmpegDataEventHandler.bind(this)
    this.ffmpegErrorEventHandler = this.ffmpegErrorEventHandler.bind(this)
    this.ffmpegSTDOUTErrorEventHandler =
      this.ffmpegSTDOUTErrorEventHandler.bind(this)

    if (this.ffmpeg_exec) {
      this.ffmpeg_exec.stdout &&
        this.ffmpeg_exec.stdout.on('data', this.ffmpegDataEventHandler)

      this.ffmpeg_exec.stderr &&
        this.ffmpeg_exec.stderr.on('data', this.ffmpegSTDOUTErrorEventHandler)

      this.ffmpeg_exec.on('close', this.ffmpegCloseEventHandler)
      this.ffmpeg_exec.on('error', this.ffmpegErrorEventHandler)
    }
  }

  ffmpegErrorEventHandler(e: Error) {
    Logger.ffdebug(e)
  }

  ffmpegCloseEventHandler(_code: number, _signal: string) {
    Logger.log(`[Transmuxing end] ${this.path}`)
    this.emit('end', this.id)
  }

  ffmpegSTDOUTErrorEventHandler(error: Error) {
    Logger.ffdebug(`FFerr：${error}`)
  }

  ffmpegDataEventHandler(chunk: Buffer | string | any) {
    Logger.ffdebug(`FFout: ${chunk}`)
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
