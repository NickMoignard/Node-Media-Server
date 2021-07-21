import { ArgvArray } from "."
import FilterComplexConfig from "./filterComplexConfig"

const fcConf = new FilterComplexConfig()

test('Codex Params', () => {
    const vers = fcConf.versions.map(vConf => vConf)
    const args = vers[0].codecParams.forExec()
    const example = [
        '-x264-params',
        '"nal-hrd=cbr:force-cfr=1"'
    ]

    expect(args).toEqual(example)
})
test('Video Bitrate', () => {
    const vers = fcConf.versions.map(vConf => vConf)
    const args = vers[0].video_bitrate.forExec()
    
    const example = [
        '-b:v:0', '10M', '-maxrate:v:0', '10M', '-minrate:v:0', '10M', '-bufsize:v:0', '20M'
    ]

    expect(args).toEqual(example)
})