import { ArgvArray } from "."
import FilterComplexConfig from "./filterComplexConfig"

const fcConf = new FilterComplexConfig()

test('VideoConfig videoMaps for base FilterComplexConfig', () => {
    const vers = fcConf.versions.map(vConf => vConf)
    const argv = new ArgvArray()
    for (var i = 0; i < vers.length; i++){
        argv.add(vers[i].vidOutputArgs(i))
    }
    const example = [
        '-map',
        '[v1out]',
        '-c:v:0', 'libx264',
        '-x264-params', '"nal-hrd=cbr:force-cfr=1"',
        '-b:v:0', '10M',
        '-maxrate:v:0', '10M',
        '-minrate:v:0', '10M',
        '-bufsize:v:0', '20M',
        '-preset', 'slow',
        '-g', '48',
        '-sc_threshold', '0',
        '-keyint_min', '48',
        '-map',
        '[v2out]',
        '-c:v:1', 'libx264',
        '-x264-params', '"nal-hrd=cbr:force-cfr=1"',
        '-b:v:0', '3M',
        '-maxrate:v:0', '3M',
        '-minrate:v:0', '3M',
        '-bufsize:v:0', '3M',
        '-preset', 'slow',
        '-g', '48',
        '-sc_threshold', '0',
        '-keyint_min', '48',
        '-map',
        '[v3out]',
        '-c:v:2', 'libx264',
        '-x264-params', '"nal-hrd=cbr:force-cfr=1"',
        '-b:v:0', '1M',
        '-maxrate:v:0', '1M',
        '-minrate:v:0', '1M',
        '-bufsize:v:0', '1M',
        '-preset', 'slow',
        '-g', '48',
        '-sc_threshold', '0',
        '-keyint_min', '48',
        
    ]

    expect(argv.list).toEqual(example)
})

test('ffmpeg single audio out config flags', () => {
    const vers = fcConf.versions.map(vConf => vConf)
    const argv = new ArgvArray()
    for (var i = 0; i < vers.length; i++){
        argv.add(vers[i].aOutputArgs(i))
    }
    const example = [
        'a:0', '-c:a:0', 'aac', '-b:a:0', '256k', '-ac', '2',
        'a:0', '-c:a:1', 'aac', '-b:a:1', '96k', '-ac', '2',
        'a:0', '-c:a:2', 'aac', '-b:a:2', '48k', '-ac', '2',
    ]

    expect(argv.list).toEqual(example)
})

