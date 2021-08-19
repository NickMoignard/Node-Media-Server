import WebSocket from "ws"

import BaseWSFFSession from "./classes/BaseStreamSession"
import ArgvArray from "./classes/ArgvArray"

import { StreamConf } from "../types"
import { CLIENT_ACTIONS } from "../types/enums"
class NodeStreamSession extends BaseWSFFSession {
  conf: StreamConf
  argv: ArgvArray
  
  constructor (conf: StreamConf, id: string, ws: WebSocket) {
    super(id, ws)
    this.conf = conf
    this.argv = this.wsToHLSFfArgs(`${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`)
    
  }

  // Class Methods
  run() {
    this.conf.streamPath && super.run(this.conf.ffmpeg, this.argv.list, this.conf.streamPath);
  }
  pauseSession() {
  }
  unpauseSession() {
  }
  resetSession() {
    // look for files and delete / copy them
  }

  // Extend Web Socket Callbacks
  websocketMessageEventHandler(data: Buffer | ArrayBuffer | Buffer[] | string, isBinary: boolean) {
    super.websocketMessageEventHandler(data, isBinary);
    switch (data) {
      case CLIENT_ACTIONS.startRec:
        this.run()
        break
      case CLIENT_ACTIONS.stopRec:
        this.stopFfmpeg()
        // respond with stop OK
        break
      case CLIENT_ACTIONS.resetRect:
        this.resetSession()
        break
      case CLIENT_ACTIONS.unpauseRec:
        this.unpauseSession()
        break
      case CLIENT_ACTIONS.pauseRec:
        // respond with OK
        this.pauseSession()
        break
      default:
        if (Buffer.isBuffer(data)) {
          // get session
          this.addBufferToFfmpeg(data)
        }
        break
    }
  }
  websocketErrorEventHandler(error: Error) {
    super.websocketErrorEventHandler(error)
  }
  websocketClosedEventHandler(code: number, reason: Buffer) {
    super.websocketClosedEventHandler(code, reason)
    this.stopFfmpeg()
  }

  // Private
  wsToHLSFfArgs(outpath: string) {
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
  
    // OUTPUT URL
    // argv.add(['-f', 'flv', rtmpUrl])
      
    // hls
    // argv.add(["-f", "hls"])
    // argv.add(["-hls_time", "2"])
    // argv.add(["-hls_flags", "independant_segments"])
    // argv.add(["-hls_segment_type", "mpegts"])
    // argv.add(["-hls_list_size", "6900"])
    // argv.add(["-hls_segment_filename", "stream_%v/data%02d.ts"])
    // argv.add(["-master_pl_name", "master.m3u8"])
    // argv.add(["-var_stream_map", '"v:0,a:0 v:1,a:1 v:2,a:2" stream_%v.m3u8'])
    return argv
  }
}

export default NodeStreamSession
