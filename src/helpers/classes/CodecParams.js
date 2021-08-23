"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CodecParams = /** @class */ (function () {
    function CodecParams(flag, params) {
        if (flag === void 0) { flag = "-x264-params"; }
        if (params === void 0) { params = "\"nal-hrd=cbr:force-cfr=1\""; }
        this.flag = flag;
        this.paramString = params;
    }
    CodecParams.prototype.forExec = function () {
        return [this.flag, this.paramString];
    };
    return CodecParams;
}());
exports.default = CodecParams;
