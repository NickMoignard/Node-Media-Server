"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nmsAuthParam = void 0;
var md5_1 = __importDefault(require("md5"));
var nmsAuthParam = function (path) {
    var nmsSecret = process.env.NMS_SECRET;
    if (!nmsSecret)
        return '';
    var timestamp = new Date(new Date().valueOf() + 60 * 60 * 1000);
    var hash = md5_1.default(path + "-" + timestamp.valueOf() + "-" + nmsSecret);
    return "?sign=" + timestamp + "-" + hash;
};
exports.nmsAuthParam = nmsAuthParam;
