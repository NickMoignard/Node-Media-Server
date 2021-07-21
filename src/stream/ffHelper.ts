import { ArgvArray } from "./classes"
import FilterComplexConfig from "./classes/filterComplexConfig"

export const ffArgvHelper = (nmsConf: any, filterConf: FilterComplexConfig) => {

    let argv = new ArgvArray(['-y']) // Overwrite output files without asking.

    // inPath
    const inputPath =  `rtmp://127.0.0.1:${nmsConf.rtmpPort}${nmsConf.streamPath}`
    argv.add(['-i', inputPath])


    // Split input video into multiple versions
    argv.add(filterConf.filterComplexArgs())

    // configure each video output
    filterConf.versions.forEach((vers, i) => {
        argv.add(vers.vidOutputArgs(i))
    })

    // configure each audio output
    filterConf.versions.forEach((vers, i) => {
        argv.add(vers.aOutputArgs(i))
    })

    // hls
    argv.add(["-f", "hls"])
    argv.add(["-hls_time", "2"])
    argv.add(["-hls_flags", "independant_segments"])
    argv.add(["-hls_segment_type", "mpegts"])
    argv.add(["-hls_list_size", "6900"])
    argv.add(["-hls_segment_filename", "stream_%v/data%02d.ts"])
    argv.add(["-master_pl_name", "master.m3u8"])
    argv.add(["-var_stream_map", '"v:0,a:0 v:1,a:1 v:2,a:2" stream_%v.m3u8'])

    return argv.list
}
