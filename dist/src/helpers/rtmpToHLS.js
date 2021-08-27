"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mkdirp = require('mkdirp');
var fs = require('fs');
var cp = require('child_process'); //spawn
var ffmpeg = require('ffmpeg-static');
// uninstall me import lineReader from 'line-reader'
var rtmpToHLS = function (streamPath) {
    var renditions = [
        // {res: '426x240', vb: '400k', ab: '64k'},
        // {res: '640x360', vb: '800k', ab: '96k'},
        // {res: '842x480', vb: '1400k', ab: '128k'},
        { res: '1280x720', vb: '2800k', ab: '128k' },
        // {res: '1920x1080', vb: '5000k', ab: '192k'},
    ];
    var segment_target_duration = 6; // try to create a new segment every X seconds
    var MAX_BITRATE_RATIO = 1.07; // maximum accepted bitrate fluctuations
    var RATE_MONITOR_BUFFER_RATIO = 1.5; // maximum buffer size between bitrate conformance checks
    var AUDIO_RATE = 4800;
    var source = "rtmp://127.0.0.1:" + (process.env.RTMP_PORT ? process.env.RTMP_PORT : 1935) + streamPath;
    var MEDIA_ROOT = '../../media';
    if (!MEDIA_ROOT)
        throw new Error('Could not find media root. please check env variables');
    // - TODO: fs.mkdir
    try {
        mkdirp.sync(MEDIA_ROOT);
        fs.accessSync(MEDIA_ROOT, fs.constants.W_OK);
    }
    catch (error) {
        console.error("Node Media Trans Server startup failed. MediaRoot:" + MEDIA_ROOT + " cannot be written.");
        return;
    }
    try {
        mkdirp.sync("" + MEDIA_ROOT + streamPath);
        fs.accessSync("" + MEDIA_ROOT + streamPath, fs.constants.W_OK);
    }
    catch (error) {
        console.error("Node Media Trans Server startup failed. MediaRoot:=" + MEDIA_ROOT + streamPath + " cannot be written.");
        return;
    }
    // - TODO: Probe
    // key_frames_interval="$(echo `ffprobe ${source} 2>&1 | grep -oE '[[:digit:]]+(.[[:digit:]]+)? fps' | grep -oE '[[:digit:]]+(.[[:digit:]]+)?'`*2 | bc || echo '')"
    // key_frames_interval=${key_frames_interval:-50}
    // key_frames_interval=$(echo `printf "%.1f\n" $(bc -l <<<"$key_frames_interval/10")`*10 | bc) # round
    // key_frames_interval=${key_frames_interval%.*} # truncate to integer
    var key_frames_interval = 48;
    var static_params = "-c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0";
    static_params += " -g " + key_frames_interval + " -keyint_min " + key_frames_interval + " -hls_time " + segment_target_duration;
    static_params += " -hls_list_size 0";
    var misc_params = "-hide_banner -y";
    var master_playlist = '#EXTM3U\n#EXT-X-VERSION:3\n';
    var pathWithName = function (name) {
        return "" + MEDIA_ROOT + streamPath + "/" + name;
    };
    var cmd = "";
    var files = [];
    renditions.forEach(function (r) {
        var width = r.res.split('x')[0];
        var height = r.res.split('x')[1];
        var maxrate = parseInt(r.vb.replace('k', '')) * MAX_BITRATE_RATIO + "k";
        var bufsize = parseInt(r.vb.replace('k', '')) * RATE_MONITOR_BUFFER_RATIO + "k";
        var bandwidth = r.vb.replace('k', '') + "000";
        var name = height + "p";
        files.push(pathWithName(name) + ".m3u8");
        cmd += " " + static_params + " -vf scale=w=" + width + ":h=" + height + ":force_original_aspect_ratio=decrease";
        cmd += " -b:v " + r.vb + " -maxrate " + maxrate + " -bufsize " + bufsize + " -b:a " + AUDIO_RATE;
        cmd += " -hls_flags append_list+independent_segments+program_date_time+second_level_segment_index -hls_playlist_type vod -strftime 1 -hls_segment_filename " + pathWithName(name) + "_%Y%m%d-%%04d.ts " + pathWithName(name) + ".m3u8";
        //   # add rendition entry in the master playlist
        master_playlist += "#EXT-X-STREAM-INF:BANDWIDTH=" + bandwidth + ",RESOLUTION=" + r.res + "\n" + name + ".m3u8" + "\n";
    });
    var argArray = (misc_params + " -i " + source + " " + cmd).split(' ');
    // # start conversion
    console.log("Executing command:\nffmpeg " + misc_params + " -i " + source + " " + cmd);
    var childProcess = cp.spawn(ffmpeg, argArray);
    // (e, stdout, stderr) => {
    //   if (e) {
    //     console.error(`ffmpeg exec error: ${e}`)
    //     return
    //   }
    //   console.log(`stdout: ${stdout}`)
    //   console.error(`stderr: ${stderr}`)
    // }
    childProcess.stdout.on('data', function (data) {
        console.log(data);
    });
    // console.log('master playlist', master_playlist)
    fs.writeFile("" + MEDIA_ROOT + streamPath + "/playlist.m3u8", master_playlist, function () { });
    // echo "Done - encoded HLS is at ${target}/"
    console.log("Done - encoded HLS is at http://localhost:" + (process.env.MEDIA_PORT ? process.env.MEDIA_PORT : 7666) + "/" + streamPath);
};
exports.default = rtmpToHLS;
