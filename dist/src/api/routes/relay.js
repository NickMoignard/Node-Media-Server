var express = require('express');
var relayController = require('../controllers/relay');
module.exports = function (context) {
    var router = express.Router();
    router.get('/', relayController.getStreams.bind(context));
    router.post('/pull', relayController.pullStream.bind(context));
    router.post('/push', relayController.pushStream.bind(context));
    return router;
};
