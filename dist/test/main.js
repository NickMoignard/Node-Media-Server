"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import rtmpToHLS from "./ffmpeg/rtmpToHLS"
var NodeMediaServer = require('../src/node_media_server');
var dotenv = require('dotenv');
var ffmpeg = require('ffmpeg-static');
var ffprobe = require('ffprobe-static');
// should move higher in the build order
dotenv.config();
var env = process.env;
env.FFMPEG_PATH = ffmpeg;
env.FFPROBE_PATH = ffprobe.path;
var nmsSecret = process.env.NMS_SECRET;
var mediaRoot = process.env.MEDIA_ROOT;
var config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 10,
        ping_timeout: 20,
    },
    // auth: {
    //   play: true,
    //   publish: true,
    //   secret: nmsSecret,
    // },
    http: {
        port: 8000,
        mediaroot: mediaRoot,
        allow_origin: '*',
    },
    stream: {
        ffmpeg: ffmpeg,
        mediaroot: mediaRoot,
        app: 'live',
    },
    // trans: {
    //   ffmpeg: ffmpeg,
    //   tasks: [
    //     {
    //       app: 'live',
    //       hls: true,
    //       hlsFlags: '[hls_time=6:hls_list_size=0:hls_flags=append_list]',
    //     },
    //   ],
    // },
};
var server = new NodeMediaServer(config);
// server.on('postPublish', (id: string, streamPath: string, args: any) => {
//   console.log('===================== postPublish', id, streamPath, args)
//   const process = () => {
//     rtmpToHLS(streamPath)
//   }
//   setTimeout(process, 2000)
// })
// server.on('donePublish', (id: string, streamPath: string, args: any) => {
//   console.log('===================== donePublish', id, streamPath, args)
// })
server.run();
