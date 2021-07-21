import FilterComplexConfig from './classes/filterComplexConfig'
import { ffArgvHelper } from './ffHelper'

const config = {
    app: 'live',
    ffmpeg: 'ffmpegPath',
    mediaroot: './../streams/media',
    rtmpPort: 1935,
    streamPath: '/testpath',
    streamName: 'testname'
}

test("test stream ffmpeg args", () => {
    const args = ffArgvHelper(config, new FilterComplexConfig())
    const example = ["-y", "-i", "rtmp://127.0.0.1:1935/testpath", "-filter_complex", "\"[0:v]split=3[v1][v2][v3]; [v1]copy[v1out]; [v2]scale=w=-1:h=720[v2out]; [v3]scale=w=-1:h=360[v3out]\"", "-map", "[v1out]", "-c:v:0", "libx264", "-x264-params", "\"nal-hrd=cbr:force-cfr=1\"", "-b:v:0", "10M", "-maxrate:v:0", "10M", "-minrate:v:0", "10M", "-bufsize:v:0", "20M", "-preset", "slow", "-g", "48", "-sc_threshold", "0", "-keyint_min", "48", "-map", "[v2out]", "-c:v:1", "libx264", "-x264-params", "\"nal-hrd=cbr:force-cfr=1\"", "-b:v:0", "3M", "-maxrate:v:0", "3M", "-minrate:v:0", "3M", "-bufsize:v:0", "3M", "-preset", "slow", "-g", "48", "-sc_threshold", "0", "-keyint_min", "48", "-map", "[v3out]", "-c:v:2", "libx264", "-x264-params", "\"nal-hrd=cbr:force-cfr=1\"", "-b:v:0", "1M", "-maxrate:v:0", "1M", "-minrate:v:0", "1M", "-bufsize:v:0", "1M", "-preset", "slow", "-g", "48", "-sc_threshold", "0", "-keyint_min", "48", "a:0", "-c:a:0", "aac", "-b:a:0", "256k", "-ac", "2", "a:0", "-c:a:1", "aac", "-b:a:1", "96k", "-ac", "2", "a:0", "-c:a:2", "aac", "-b:a:2", "48k", "-ac", "2", "-f", "hls", "-hls_time", "2", "-hls_flags", "independant_segments", "-hls_segment_type", "mpegts", "-hls_list_size", "6900", "-hls_segment_filename", "stream_%v/data%02d.ts", "-master_pl_name", "master.m3u8", "-var_stream_map", "\"v:0,a:0 v:1,a:1 v:2,a:2\" stream_%v.m3u8"]

    expect(args).toEqual(example)
})