import { VideoBitrate, CodecParams, ArgvArray } from "."

class VideoConfig {
    w?: number
    h?: number
    audio_codec: string
    audio_bitrate: string
    // find out if this is actually audio channels
    audio_channels: number
    video_codec: string
    video_bitrate: VideoBitrate
    codecParams: CodecParams
    preset: string
    g: number // -g 48
    sc_threshold: number // -sc_threshold 0
    keyint_min: number// -keyint_min 48
    original: boolean

    constructor(
      w?: number,
      h?: number,
      ab: string = "256k",
      vb: VideoBitrate = new VideoBitrate("10M", "10M","10M","20M"),
      aChannels: number = 2,
      ac: string = "aac",
      vc: string = "libx264",
      codecParams: CodecParams = new CodecParams(),
      preset: string = "slow",
      g: number = 48,
      sc_threshold: number = 0,
      keyint_min: number = 48,
      original: boolean = false
    ) {
        if (w && h) {
            this.w = w
            this.h = h
        }
        this.original = original
        this.audio_codec = ac
        this.audio_bitrate = ab
        this.video_codec = vc
        this.video_bitrate = vb
        this.audio_channels = aChannels
        this.codecParams = codecParams
        this.preset = preset
        this.g = g
        this.sc_threshold = sc_threshold
        this.keyint_min = keyint_min
    }

    vidOutputArgs = (index: number): Array<string> => {
        const argv = new ArgvArray(["-map", `[v${index + 1}out]`])
        argv.add([`-c:v:${index}`, this.video_codec])
        argv.add(this.codecParams.forExec())
        argv.add(this.video_bitrate.forExec())
        argv.add(["-preset", this.preset])
        argv.add(["-g", `${this.g}`])
        argv.add(["-sc_threshold", `${this.sc_threshold}`])
        argv.add(["-keyint_min", `${this.keyint_min}`])

        return argv.list
    }
    aOutputArgs = (index: number): Array<string> => {
        const argv = new ArgvArray(['a:0'])
        argv.add([`-c:a:${index}`, this.audio_codec])
        argv.add([`-b:a:${index}`, this.audio_bitrate])
        argv.add(["-ac", `${this.audio_channels}`])

        return argv.list
    }
}

export default VideoConfig
