var NodeRtmpClient = require('./node_rtmp_client');
var rc = new NodeRtmpClient('rtmp://192.168.0.10/live/stream');
var rp = new NodeRtmpClient('rtmp://192.168.0.20/live/stream');
rc.on('audio', function (audioData, timestamp) {
    rp.pushAudio(audioData, timestamp);
});
rc.on('video', function (videoData, timestamp) {
    rp.pushVideo(videoData, timestamp);
});
rc.on('script', function (scriptData, timestamp) {
    rp.pushScript(scriptData, timestamp);
});
rc.on('status', function (info) {
    console.log('player on status', info);
    if (info.code === 'NetStream.Play.UnpublishNotify') {
        rc.stop();
    }
});
rc.on('close', function () {
    console.log('player on close');
    rp.stop();
});
rp.on('close', function () {
    console.log('publisher on close');
    rc.stop();
});
rp.on('status', function (info) {
    console.log('publisher on status', info);
    if (info.code === 'NetStream.Publish.Start') {
        rc.startPull();
    }
});
rp.startPush();
