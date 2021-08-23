//
//  Created by Mingliang Chen on 17/12/24.  Merry Christmas
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var OS = require('os');
function cpuAverage() {
    //Initialise sum of idle and time of cores and fetch CPU info
    var totalIdle = 0, totalTick = 0;
    var cpus = OS.cpus();
    //Loop through CPU cores
    for (var i = 0, len = cpus.length; i < len; i++) {
        //Select CPU core
        var cpu = cpus[i];
        //Total up the time in the cores tick
        for (type in cpu.times) {
            totalTick += cpu.times[type];
        }
        //Total up the idle time of the core
        totalIdle += cpu.times.idle;
    }
    //Return the average Idle and Tick times
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}
function percentageCPU() {
    return new Promise(function (resolve, reject) {
        var startMeasure = cpuAverage();
        setTimeout(function () {
            var endMeasure = cpuAverage();
            //Calculate the difference in idle and total time between the measures
            var idleDifference = endMeasure.idle - startMeasure.idle;
            var totalDifference = endMeasure.total - startMeasure.total;
            //Calculate the average percentage CPU usage
            var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
            resolve(percentageCPU);
        }, 100);
    });
}
function getSessionsInfo(sessions) {
    var info = {
        inbytes: 0,
        outbytes: 0,
        rtmp: 0,
        http: 0,
        ws: 0,
    };
    for (var _i = 0, _a = sessions.values(); _i < _a.length; _i++) {
        var session = _a[_i];
        if (session.TAG === 'relay')
            continue;
        var socket = session.TAG === 'rtmp' ? session.socket : session.req.socket;
        info.inbytes += socket.bytesRead;
        info.outbytes += socket.bytesWritten;
        info.rtmp += session.TAG === 'rtmp' ? 1 : 0;
        info.http += session.TAG === 'http-flv' ? 1 : 0;
        info.ws += session.TAG === 'websocket-flv' ? 1 : 0;
    }
    return info;
}
function getInfo(req, res, next) {
    var _this = this;
    var s = this.sessions;
    percentageCPU().then(function (cpuload) {
        var sinfo = getSessionsInfo(s);
        var info = {
            os: {
                arch: OS.arch(),
                platform: OS.platform(),
                release: OS.release(),
            },
            cpu: {
                num: OS.cpus().length,
                load: cpuload,
                model: OS.cpus()[0].model,
                speed: OS.cpus()[0].speed,
            },
            mem: {
                totle: OS.totalmem(),
                free: OS.freemem()
            },
            net: {
                inbytes: _this.stat.inbytes + sinfo.inbytes,
                outbytes: _this.stat.outbytes + sinfo.outbytes,
            },
            nodejs: {
                uptime: Math.floor(process.uptime()),
                version: process.version,
                mem: process.memoryUsage()
            },
            clients: {
                accepted: _this.stat.accepted,
                active: _this.sessions.size - _this.idlePlayers.size,
                idle: _this.idlePlayers.size,
                rtmp: sinfo.rtmp,
                http: sinfo.http,
                ws: sinfo.ws
            }
        };
        res.json(info);
    });
}
exports.getInfo = getInfo;
