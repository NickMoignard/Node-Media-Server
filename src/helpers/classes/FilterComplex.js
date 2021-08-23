"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterComplexConfig = exports.VideoConfig = exports.VideoBitrate = void 0;
var ArgvArray_1 = __importDefault(require("./ArgvArray"));
var CodecParams_1 = __importDefault(require("./CodecParams"));
var VideoBitrate = /** @class */ (function () {
    function VideoBitrate(rate, max, min, buffer) {
        this.rate = rate;
        this.max = max;
        this.min = min;
        this.buffer = buffer;
    }
    VideoBitrate.prototype.forExec = function (index) {
        // 5M -maxrate:v:0 5M -minrate:v:0 5m -bufsize:v:0 10M
        return [
            "-b:v:" + index,
            this.rate,
            "-maxrate:v:" + index,
            this.max,
            "-minrate:v:" + index,
            this.min,
            "-bufsize:v:" + index,
            this.buffer
        ];
    };
    return VideoBitrate;
}());
exports.VideoBitrate = VideoBitrate;
var VideoConfig = /** @class */ (function () {
    function VideoConfig(w, h, ab, vb, aChannels, ac, vc, codecParams, preset, g, sc_threshold, keyint_min) {
        var _this = this;
        if (aChannels === void 0) { aChannels = 2; }
        if (ac === void 0) { ac = "aac"; }
        if (vc === void 0) { vc = "libx264"; }
        if (codecParams === void 0) { codecParams = new CodecParams_1.default(); }
        if (preset === void 0) { preset = "slow"; }
        if (g === void 0) { g = 48; }
        if (sc_threshold === void 0) { sc_threshold = 0; }
        if (keyint_min === void 0) { keyint_min = 48; }
        this.vidOutputArgs = function (index) {
            // return ~= [
            //   '[v1out]',
            //     '-c:v:0', 'libx264',
            //     '-x264-params', '"nal-hrd=cbr:force-cfr=1"',
            //     '-b:v:0', '5M',
            //     '-maxrate:v:0', '5M',
            //     '-minrate:v:0', '5M',
            //     '-bufsize:v:0', '10M',
            //     '-preset', 'slow',
            //     '-g', '48',
            //     '-sc_threshold', '0',
            //     '-keyint_min', '48'
            // ]
            var argv = new ArgvArray_1.default(["-map", "[v" + index + "out]"]);
            argv.add(["-c:v:" + (index - 1), _this.video_codec]);
            argv.add(_this.codecParams.forExec());
            argv.add(_this.video_bitrate.forExec(index - 1));
            argv.add(["-preset", _this.preset]);
            argv.add(["-g", "" + _this.g]);
            argv.add(["-sc_threshold", "" + _this.sc_threshold]);
            argv.add(["-keyint_min", "" + _this.keyint_min]);
            return argv.list;
        };
        this.aOutputArgs = function (index) {
            // returns ~= [ 'a:0', '-c:a:0', 'aac', '-b:a:0', '96k', '-ac', '2']
            var argv = new ArgvArray_1.default(["a:" + index]);
            argv.add(["-c:a:" + index, _this.audio_codec]);
            argv.add(["-b:a:" + index, _this.audio_bitrate]);
            argv.add(["-ac", "" + _this.audio_channels]);
            return argv.list;
        };
        this.w = w;
        this.h = h;
        this.audio_codec = ac;
        this.audio_bitrate = ab;
        this.video_codec = vc;
        this.video_bitrate = vb;
        this.audio_channels = aChannels;
        this.codecParams = codecParams;
        this.preset = preset;
        this.g = g;
        this.sc_threshold = sc_threshold;
        this.keyint_min = keyint_min;
    }
    return VideoConfig;
}());
exports.VideoConfig = VideoConfig;
var FilterComplexConfig = /** @class */ (function () {
    function FilterComplexConfig(vers) {
        var _this = this;
        this.filterComplexArgs = function () {
            // returns ~= "[0:v]split=3[v1][v2][v3]; [v1]copy[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=640:h=360[v3out]"
            var vers = _this.versions;
            var ffOuts = '', ffScales = '';
            for (var i = 1; i < vers.length + 2; i++) {
                var last = function () { return vers.length + 2 === i; };
                var first = function () { return i === 1; };
                var semi = last() ? '' : ';';
                ffOuts += "[v" + i + "]";
                if (first()) {
                    ffScales += "[v1]copy[v1out]" + semi + " ";
                }
                else {
                    var conf = vers[i - 2];
                    ffScales += "[v" + i + "]scale=w=" + conf.w + ":h=" + conf.h + "[v" + i + "out]" + semi + " ";
                }
            }
            return ["-filter_complex", "[0:v]split=" + (vers.length + 1) + ffOuts + "; " + ffScales];
        };
        if (!vers) {
            this._versions = [
                new VideoConfig(1920, 1080, "256k", new VideoBitrate("5M", "5M", "5M", "10M")),
                new VideoConfig(1280, 720, "96k", new VideoBitrate("3M", "3M", "3M", "3M")),
                new VideoConfig(640, 360, "48k", new VideoBitrate("1M", "1M", "1M", "1M"))
            ];
        }
        else {
            if (vers.length > 0) {
                this._versions = vers;
            }
            else {
                throw new Error("A filter complex requires at least one version");
            }
        }
    }
    Object.defineProperty(FilterComplexConfig.prototype, "versions", {
        get: function () {
            return this._versions;
        },
        set: function (vers) {
            this._versions = vers;
        },
        enumerable: false,
        configurable: true
    });
    return FilterComplexConfig;
}());
exports.FilterComplexConfig = FilterComplexConfig;
