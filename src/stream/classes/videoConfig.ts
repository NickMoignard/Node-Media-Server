import ArgvArray from "./ArgvArray"
import CodecParams from "./CodecParams"
import VideoBitrate from "./VideoBitrate"

class VideoConfig {
    w: number
    h: number
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

    constructor(
      w: number,
      h: number,
      ab: string,
      vb: VideoBitrate,
      aChannels: number = 2,
      ac: string = "aac",
      vc: string = "libx264",
      codecParams: CodecParams = new CodecParams(),
      preset: string = "slow",
      g: number = 48,
      sc_threshold: number = 0,
      keyint_min: number = 48
    ) {
        this.w = w
        this.h = h
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
        // return ~= [
        //   '[v1out]',
        //     '-c:v:0', 'libx264',
        //     '-x264-params', '"nal-hrd=cbr:force-cfr=1"',
        //     '-b:v:0', '5M',
        //     '-maxrate:v:0', '5M',
        //     '-minrate:v:0', '5M',
        //     '-bufsize:v:0', '10M',
        //     '-preset', 'slow',
        //     '-g', '48',
        //     '-sc_threshold', '0',
        //     '-keyint_min', '48'
        // ]
        const argv = new ArgvArray(["-map", `[v${index}out]`])

        argv.add([`-c:v:${index - 1}`, this.video_codec])
        argv.add(this.codecParams.forExec())
        argv.add(this.video_bitrate.forExec(index - 1))
        argv.add(["-preset", this.preset])
        argv.add(["-g", `${this.g}`])
        argv.add(["-sc_threshold", `${this.sc_threshold}`])
        argv.add(["-keyint_min", `${this.keyint_min}`])

        return argv.list
    }
    aOutputArgs = (index: number): Array<string> => {
        // returns ~= [ 'a:0', '-c:a:0', 'aac', '-b:a:0', '96k', '-ac', '2']
        const argv = new ArgvArray([`a:${index}`])
        argv.add([`-c:a:${index}`, this.audio_codec])
        argv.add([`-b:a:${index}`, this.audio_bitrate])
        argv.add(["-ac", `${this.audio_channels}`])
        return argv.list
    }
}

export default VideoConfig
