class CodecParams {
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

export default CodecParams