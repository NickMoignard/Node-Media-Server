import { VideoBitrate } from "."
import VideoConfig from "./videoConfig"

class FilterComplexConfig {
    #versions: Array<VideoConfig>

    constructor(vers?: Array<VideoConfig>) {
        if (!vers) {
            this.#versions = [
                new VideoConfig(),
                new VideoConfig(-1, 720,"96k", new VideoBitrate("3M", "3M", "3M", "3M")),
                new VideoConfig(-1, 360,"48k", new VideoBitrate("1M", "1M", "1M", "1M"))
            ]
        } else {
            if (vers.length > 0) {
                this.#versions =  vers
            } else {
                throw new Error("A filter complex requires at least one version")
            }
        }
    }

    get versions(): Array<VideoConfig> {
        return this.#versions
    }
    set versions(vers: Array<VideoConfig>) {
        this.#versions = vers
    }
    filterComplexArgs = (): Array<string> => {
        // returns ~= "[0:v]split=3[v1][v2][v3]; [v1]copy[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=640:h=360[v3out]"
        const vers = this.versions
        
        let ffOuts = '',
            ffScales = ''

        for (var i = 1; i < vers.length + 1; i++) {
            ffOuts += `[v${i}]`
            if (i === 1) {
                ffScales += `[v1]copy[v1out];`
            } else {
                let conf = vers[i - 1]
                ffScales += ` [v${i}]scale=w=${conf.w}:h=${conf.h}[v${i}out];`
            }
        }
        
        return ["-filter_complex", `"[0:v]split=${vers.length}${ffOuts}; ${ffScales.slice(0, ffScales.length - 1)}"`]
    }
}

export default FilterComplexConfig
