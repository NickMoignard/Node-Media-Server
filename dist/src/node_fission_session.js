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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
//
//  Created by Chen Mingliang on 20/7/16.
//  illuspas[a]msn.com
//  Copyright (c) 2020 Nodemedia. All rights reserved.
//
var Logger = require('./node_core_logger');
var EventEmitter = require('events');
var spawn = require('child_process').spawn;
var NodeFissionSession = /** @class */ (function (_super) {
    __extends(NodeFissionSession, _super);
    function NodeFissionSession(conf) {
        var _this = _super.call(this) || this;
        _this.conf = conf;
        return _this;
    }
    NodeFissionSession.prototype.run = function () {
        var _this = this;
        var inPath = 'rtmp://127.0.0.1:' + this.conf.rtmpPort + this.conf.streamPath;
        var argv = ['-i', inPath];
        for (var _i = 0, _a = this.conf.model; _i < _a.length; _i++) {
            var m = _a[_i];
            var x264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-maxrate', m.vb, '-bufsize', m.vb, '-g', parseInt(m.vf) * 2, '-r', m.vf, '-s', m.vs];
            var aac = ['-c:a', 'aac', '-b:a', m.ab];
            var outPath = ['-f', 'flv', 'rtmp://127.0.0.1:' + this.conf.rtmpPort + '/' + this.conf.streamApp + '/' + this.conf.streamName + '_' + m.vs.split('x')[1]];
            argv.splice.apply(argv, __spreadArray([argv.length, 0], x264));
            argv.splice.apply(argv, __spreadArray([argv.length, 0], aac));
            argv.splice.apply(argv, __spreadArray([argv.length, 0], outPath));
        }
        argv = argv.filter(function (n) { return n; });
        this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
        this.ffmpeg_exec.on('error', function (e) {
            Logger.ffdebug(e);
        });
        this.ffmpeg_exec.stdout.on('data', function (data) {
            Logger.ffdebug("FF\u8F93\u51FA\uFF1A" + data);
        });
        this.ffmpeg_exec.stderr.on('data', function (data) {
            Logger.ffdebug("FF\u8F93\u51FA\uFF1A" + data);
        });
        this.ffmpeg_exec.on('close', function (code) {
            Logger.log('[Fission end] ' + _this.conf.streamPath);
            _this.emit('end');
        });
    };
    NodeFissionSession.prototype.end = function () {
        this.ffmpeg_exec.kill();
    };
    return NodeFissionSession;
}(EventEmitter));
module.exports = NodeFissionSession;
