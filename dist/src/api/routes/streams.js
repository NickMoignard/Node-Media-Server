var express = require('express');
var streamController = require('../controllers/streams');
module.exports = function (context) {
    var router = express.Router();
    router.post('/trans', streamController.postStreamTrans.bind(context));
    router.get('/', streamController.getStreams.bind(context));
    router.get('/:app/:stream', streamController.getStream.bind(context));
    router.delete('/:app/:stream', streamController.delStream.bind(context));
    return router;
};
