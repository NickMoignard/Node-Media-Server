export class VideoBitrate {
    rate: string
    max: string
    min: string
    buffer: string

    constructor(rate, max, min, buffer) {
      this.rate = rate
      this.max = max
      this.min = min
      this.buffer = buffer
    }

    forExec() {
        // 5M -maxrate:v:0 5M -minrate:v:0 5m -bufsize:v:0 10M
        return [
            `-b:v:0`,
            this.rate,
            `-maxrate:v:0`,
            this.max,
            `-minrate:v:0`,
            this.min,
            `-bufsize:v:0`,
            this.buffer
        ]
    }
}

export class CodecParams {
    flag: string
    paramString: string
    
    constructor(flag: string = "-x264-params", params: string = `"nal-hrd=cbr:force-cfr=1"`) {
        this.flag = flag
        this.paramString = params
    }
    forExec() {
        return [this.flag, this.paramString]
    }
}

export class ArgvArray {
    #list: Array<string>
    constructor(list?: Array<string>) {
        this.#list = list ? list : []
    }
    get list() {
        return this.#list.map(n => n)
    }
    set list(list: Array<string>) {
        this.#list = list
    }
    add(list: Array<string>) {
        Array.prototype.push.apply(this.#list, list)
    }
}
