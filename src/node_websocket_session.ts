import WebSocket from "ws"
import ArgvArray from "./helpers/classes/ArgvArray"
import Logger from "./node_core_logger"
import { StreamConf } from "./types"
import { CLIENT_ACTIONS } from "./types/enums"
import BaseWebSocketSession from "./base_node_websocket_server"

/**
 * Event emitting websocket stream session
 * @extends BaseWebSocketSession
 */
class WebSocketSession extends BaseWebSocketSession {
  conf: StreamConf
  argv: ArgvArray
  
  constructor (conf: StreamConf, id: string, ws: WebSocket) {
    super(id, ws)
    Logger.log('WebSocketSession constructor')
    this.conf = conf
    this.argv = this.wsToHLSFfArgs(`${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`)
    this.addWebSocketEventListners()
  }

  // Class Methods
  run() {
    this.conf.streamPath && super.run(this.conf.ffmpeg, this.argv.list, this.conf.streamPath);
    Logger.log('Web Socket Session Started')
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
  // ffmpegCloseEventHandler(code) {
  //   super.ffmpegCloseEventHandler(code)
    // ws.terminate()
  // }

  addWebSocketEventListners(){
    // EVENT LISTENERS

    this.websocketClosedEventHandler = this.websocketClosedEventHandler.bind(this)
    this.ws.on('close', this.websocketClosedEventHandler)

    this.websocketErrorEventHandler = this.websocketErrorEventHandler.bind(this)
    this.ws.on('error', this.websocketErrorEventHandler)

    this.websocketMessageEventHandler = this.websocketMessageEventHandler.bind(this)
    this.ws.on('message', this.websocketMessageEventHandler)

    this.websocketOpenEventHandler = this.websocketOpenEventHandler.bind(this)
    this.ws.on('open', this.websocketOpenEventHandler)

    this.websocketPingEventHandler = this.websocketPingEventHandler.bind(this)
    this.ws.on('ping', this.websocketPingEventHandler)

    this.websocketPongEventHandler = this.websocketPongEventHandler.bind(this)
    this.ws.on('pong', this.websocketPongEventHandler)

    this.websocketUnExpResEventHandler = this.websocketUnExpResEventHandler.bind(this)
    this.ws.on('unexpected-response', this.websocketUnExpResEventHandler)

    this.websocketUpgradeEventHandler = this.websocketUpgradeEventHandler.bind(this)
    this.ws.on('upgrade', this.websocketUpgradeEventHandler)

    // const websocketEventsMap = new Map<string, (...args: any[]) => void>([
    //   ['close', this.websocketClosedEventHandler],
    //   ['error', this.websocketErrorEventHandler],
    //   ['message', this.websocketMessageEventHandler],
    //   ['open', this.websocketOpenEventHandler],
    //   ['ping', this.websocketPingEventHandler],
    //   ['pong', this.websocketPongEventHandler],
    //   ['unexpected-response', this.websocketUnExpResEventHandler],
    //   ['upgrade', this.websocketUpgradeEventHandler],
    // ])
    
    // Object.keys(websocketEventsMap).forEach(key => { 
    //   const func = websocketEventsMap.get(key) as (...args: any[]) => void
    //   this.ws.on(key, func)
    // })
  }
  // Private
  wsToHLSFfArgs(_outpath: string) {
    let argv = new ArgvArray(['-y']) // Overwrite output files without asking.
          
    // no input path. we will manually add data to ffmpeg process
    argv.add(['-i', '-'])
  
    // note mpeg hls output
    // video codec config: low latency, adaptive bitrate
    argv.add(['-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency'])
  
    // audio codec config: sampling frequency (11025, 22050, 44100), bitrate 64 kbits
    argv.add(['-c:a', 'aac', '-strict', '-2', '-ar', '44100', '-b:a', '64k'])
  
    // audio sync
    argv.add(['-use_wallclock_as_timestamps', '1','-async', '1'])
  
    // buffer size
    argv.add(['-bufsize', '1000'])
  
    // OUTPUT URL
    argv.add(['-f', 'flv', `rtmp://localhost:1935/live/${this.id}`])
      
    // hls
    // argv.add(["-f", "hls"])
    // argv.add(["-hls_time", "2"])
    // argv.add(["-hls_flags", "independant_segments"])
    // argv.add(["-hls_segment_type", "mpegts"])

    // // Investigate
    // argv.add(["-hls_list_size", "6900"])

    // argv.add(["-hls_segment_filename", "stream_%v/data%02d.ts"])
    // argv.add(["-master_pl_name", "master.m3u8"])
    // argv.add(["-var_stream_map", '"v:0,a:0 v:1,a:1 v:2,a:2" stream_%v.m3u8'])
    return argv
  }
}
module.exports = WebSocketSession
export default WebSocketSession
