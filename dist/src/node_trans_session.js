var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//
//  Created by Mingliang Chen on 18/3/9.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var Logger = require('./node_core_logger');
var EventEmitter = require('events');
var spawn = require('child_process').spawn;
var dateFormat = require('dateformat');
var mkdirp = require('mkdirp');
var fs = require('fs');
var NodeTransSession = /** @class */ (function (_super) {
    __extends(NodeTransSession, _super);
    function NodeTransSession(conf) {
        var _this = _super.call(this) || this;
        _this.conf = conf;
        return _this;
    }
    NodeTransSession.prototype.run = function () {
        var _this = this;
        this.startTime = new Date();
        var vc = this.conf.vc || 'copy';
        var ac = this.conf.ac || 'copy';
        var inPath = 'rtmp://127.0.0.1:' + this.conf.rtmpPort + this.conf.streamPath;
        var ouPath = this.conf.mediaroot + "/" + this.conf.streamApp + "/" + this.conf.streamName;
        var mapStr = '';
        if (this.conf.rtmp && this.conf.rtmpApp) {
            if (this.conf.rtmpApp === this.conf.streamApp) {
                Logger.error('[Transmuxing RTMP] Cannot output to the same app.');
            }
            else {
                var rtmpOutput = "rtmp://127.0.0.1:" + this.conf.rtmpPort + "/" + this.conf.rtmpApp + "/" + this.conf.streamName;
                mapStr += "[f=flv]" + rtmpOutput + "|";
                Logger.log('[Transmuxing RTMP] ' + this.conf.streamPath + ' to ' + rtmpOutput);
            }
        }
        if (this.conf.mp4) {
            this.conf.mp4Flags = this.conf.mp4Flags ? this.conf.mp4Flags : '';
            var mp4FileName = dateFormat('yyyy-mm-dd-HH-MM-ss') + '.mp4';
            var mapMp4 = "" + this.conf.mp4Flags + ouPath + "/" + mp4FileName + "|";
            mapStr += mapMp4;
            Logger.log('[Transmuxing MP4] ' + this.conf.streamPath + ' to ' + ouPath + '/' + mp4FileName);
        }
        if (this.conf.hls) {
            this.conf.hlsFlags = this.conf.hlsFlags ? this.conf.hlsFlags : '';
            var hlsFileName = 'index.m3u8';
            var mapHls = "" + this.conf.hlsFlags + ouPath + "/" + hlsFileName + "|";
            mapStr += mapHls;
            Logger.log('[Transmuxing HLS] ' + this.conf.streamPath + ' to ' + ouPath + '/' + hlsFileName);
        }
        if (this.conf.dash) {
            this.conf.dashFlags = this.conf.dashFlags ? this.conf.dashFlags : '';
            var dashFileName = 'index.mpd';
            var mapDash = "" + this.conf.dashFlags + ouPath + "/" + dashFileName;
            mapStr += mapDash;
            Logger.log('[Transmuxing DASH] ' + this.conf.streamPath + ' to ' + ouPath + '/' + dashFileName);
        }
        mkdirp.sync(ouPath);
        var argv = ['-y', '-i', inPath];
        Array.prototype.push.apply(argv, ['-c:v', vc]);
        Array.prototype.push.apply(argv, this.conf.vcParam);
        Array.prototype.push.apply(argv, ['-c:a', ac]);
        Array.prototype.push.apply(argv, this.conf.acParam);
        Array.prototype.push.apply(argv, ['-f', 'tee', '-map', '0:a?', '-map', '0:v?', mapStr]);
        argv = argv.filter(function (n) { return n; }); //去空
        this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
        this.ffmpeg_exec.on('error', function (e) {
            Logger.ffdebug(e);
        });
        this.ffmpeg_exec.stdout.on('data', function (data) {
            _this.emit('data', new Date().valueOf() - _this.startTime.valueOf());
            Logger.ffdebug("FF\u8F93\u51FA\uFF1A" + data);
        });
        this.ffmpeg_exec.stderr.on('data', function (data) {
            _this.emit('error', data);
            Logger.ffdebug("FF\u8F93\u51FA\uFF1A" + data);
        });
        this.ffmpeg_exec.on('close', function (code) {
            Logger.log('[Transmuxing end] ' + _this.conf.streamPath);
            _this.emit('end');
            fs.readdir(ouPath, function (err, files) {
                if (!err) {
                    files.forEach(function (filename) {
                        if (filename.endsWith('.ts')
                            || filename.endsWith('.m3u8')
                            || filename.endsWith('.mpd')
                            || filename.endsWith('.m4s')
                            || filename.endsWith('.tmp')) {
                            fs.unlinkSync(ouPath + '/' + filename);
                        }
                    });
                }
            });
        });
    };
    NodeTransSession.prototype.processed = function () {
    };
    NodeTransSession.prototype.end = function () {
        this.ffmpeg_exec.kill();
    };
    return NodeTransSession;
}(EventEmitter));
module.exports = NodeTransSession;
