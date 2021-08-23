import ArgvArray from "./ArgvArray"
import CodecParams from "./CodecParams"

export class VideoBitrate {
    rate: string
    max: string
    min: string
    buffer: string

    constructor(rate: string, max: string, min: string, buffer: string) {
      this.rate = rate
      this.max = max
      this.min = min
      this.buffer = buffer
    }

    forExec(index: number) {
        // 5M -maxrate:v:0 5M -minrate:v:0 5m -bufsize:v:0 10M
        return [
            `-b:v:${index}`,
            this.rate,
            `-maxrate:v:${index}`,
            this.max,
            `-minrate:v:${index}`,
            this.min,
            `-bufsize:v:${index}`,
            this.buffer
        ]
    }
}

export class VideoConfig {
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

export class FilterComplexConfig {
    _versions: Array<VideoConfig>

    constructor(vers?: Array<VideoConfig>) {
        if (!vers) {
            this._versions = [
                new VideoConfig(1920, 1080,"256k", new VideoBitrate("5M", "5M", "5M", "10M")),
                new VideoConfig(1280, 720,"96k", new VideoBitrate("3M", "3M", "3M", "3M")),
                new VideoConfig(640, 360,"48k", new VideoBitrate("1M", "1M", "1M", "1M"))
            ]
        } else {
            if (vers.length > 0) {
                this._versions =  vers
            } else {
                throw new Error("A filter complex requires at least one version")
            }
        }
    }

    get versions(): Array<VideoConfig> {
        return this._versions
    }
    set versions(vers: Array<VideoConfig>) {
        this._versions = vers
    }
    filterComplexArgs = (): Array<string> => {
        // returns ~= "[0:v]split=3[v1][v2][v3]; [v1]copy[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=640:h=360[v3out]"
        const vers = this.versions
        
        let ffOuts = '',
            ffScales = ''
    
        for (var i = 1; i < vers.length + 2; i++) {
            const last = () => vers.length + 2 === i
            const first = () => i === 1
            const semi = last() ? '' : ';' 
    
            ffOuts += `[v${i}]`
            if (first()) {
                ffScales += `[v1]copy[v1out]${semi} `
            } else {
                let conf = vers[i - 2]
                ffScales += `[v${i}]scale=w=${conf.w}:h=${conf.h}[v${i}out]${semi} `
            }
        }
        return ["-filter_complex", `[0:v]split=${vers.length + 1}${ffOuts}; ${ffScales}`]
    }
}