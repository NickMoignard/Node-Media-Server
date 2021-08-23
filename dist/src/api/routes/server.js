var express = require('express');
var serverController = require('../controllers/server');
module.exports = function (context) {
    var router = express.Router();
    router.get('/', serverController.getInfo.bind(context));
    return router;
};
