class VideoBitrate {
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

export default VideoBitrate
