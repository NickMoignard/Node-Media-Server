"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rtmpToHLS_1 = __importDefault(require("../src/helpers/rtmpToHLS"));
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
server.on('postPublish', function (id, streamPath, args) {
    console.log('===================== postPublish', id, streamPath, args);
    var process = function () {
        rtmpToHLS_1.default(streamPath);
    };
    setTimeout(process, 2000);
});
server.on('donePublish', function (id, streamPath, args) {
    console.log('===================== donePublish', id, streamPath, args);
});
server.run();
