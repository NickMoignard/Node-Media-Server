"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffdebug = exports.debug = exports.error = exports.log = exports.logTime = exports.setLogType = void 0;
var chalk = require('chalk');
var LOG_TYPES = {
    NONE: 0,
    ERROR: 1,
    NORMAL: 2,
    DEBUG: 3,
    FFDEBUG: 4
};
var logType = LOG_TYPES.NORMAL;
var setLogType = function (type) {
    logType = type;
};
exports.setLogType = setLogType;
var logTime = function () {
    var nowDate = new Date();
    return nowDate.toLocaleDateString() + ' ' + nowDate.toLocaleTimeString([], { hour12: false });
};
exports.logTime = logTime;
var log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (logType < LOG_TYPES.NORMAL)
        return;
    console.log.apply(console, __spreadArray([exports.logTime(), process.pid, chalk.bold.green('[INFO]')], args));
};
exports.log = log;
var error = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (logType < LOG_TYPES.ERROR)
        return;
    console.log.apply(console, __spreadArray([exports.logTime(), process.pid, chalk.bold.red('[ERROR]')], args));
};
exports.error = error;
var debug = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (logType < LOG_TYPES.DEBUG)
        return;
    console.log.apply(console, __spreadArray([exports.logTime(), process.pid, chalk.bold.blue('[DEBUG]')], args));
};
exports.debug = debug;
var ffdebug = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (logType < LOG_TYPES.FFDEBUG)
        return;
    console.log.apply(console, __spreadArray([exports.logTime(), process.pid, chalk.bold.blue('[FFDEBUG]')], args));
};
exports.ffdebug = ffdebug;
exports.default = {
    setLogType: exports.setLogType,
    logTime: exports.logTime,
    log: exports.log,
    error: exports.error,
    debug: exports.debug,
    ffdebug: exports.ffdebug
};
