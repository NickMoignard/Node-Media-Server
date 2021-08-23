//
//  Created by Mingliang Chen on 17/8/23.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var Crypto = require('crypto');
var spawn = require('child_process').spawn;
var context = require('./node_core_ctx');
function generateNewSessionID() {
    var sessionID = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWKYZ0123456789';
    var numPossible = possible.length;
    do {
        for (var i = 0; i < 8; i++) {
            sessionID += possible.charAt((Math.random() * numPossible) | 0);
        }
    } while (context.sessions.has(sessionID));
    return sessionID;
}
function genRandomName() {
    var name = '';
    var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var numPossible = possible.length;
    for (var i = 0; i < 4; i++) {
        name += possible.charAt((Math.random() * numPossible) | 0);
    }
    return name;
}
function verifyAuth(signStr, streamId, secretKey) {
    if (signStr === undefined) {
        return false;
    }
    var now = Date.now() / 1000 | 0;
    var exp = parseInt(signStr.split('-')[0]);
    var shv = signStr.split('-')[1];
    var str = streamId + '-' + exp + '-' + secretKey;
    if (exp < now) {
        return false;
    }
    var md5 = Crypto.createHash('md5');
    var ohv = md5.update(str).digest('hex');
    return shv === ohv;
}
function getFFmpegVersion(ffpath) {
    return new Promise(function (resolve, reject) {
        var ffmpeg_exec = spawn(ffpath, ['-version']);
        var version = '';
        ffmpeg_exec.on('error', function (e) {
            reject(e);
        });
        ffmpeg_exec.stdout.on('data', function (data) {
            try {
                version = data.toString().split(/(?:\r\n|\r|\n)/g)[0].split('\ ')[2];
            }
            catch (e) {
            }
        });
        ffmpeg_exec.on('close', function (code) {
            resolve(version);
        });
    });
}
function getFFmpegUrl() {
    var url = '';
    switch (process.platform) {
        case 'darwin':
            url = 'https://ffmpeg.zeranoe.com/builds/macos64/static/ffmpeg-latest-macos64-static.zip';
            break;
        case 'win32':
            url = 'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip | https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-latest-win32-static.zip';
            break;
        case 'linux':
            url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz';
            break;
        default:
            url = 'http://ffmpeg.org/download.html';
            break;
    }
    return url;
}
module.exports = {
    generateNewSessionID: generateNewSessionID,
    verifyAuth: verifyAuth,
    genRandomName: genRandomName,
    getFFmpegVersion: getFFmpegVersion,
    getFFmpegUrl: getFFmpegUrl
};
