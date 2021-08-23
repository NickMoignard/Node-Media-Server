//
//  Created by Mingliang Chen on 18/3/2.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var EventEmitter = require('events');
var sessions = new Map();
var publishers = new Map();
var idlePlayers = new Set();
var nodeEvent = new EventEmitter();
var stat = {
    inbytes: 0,
    outbytes: 0,
    accepted: 0
};
module.exports = { sessions: sessions, publishers: publishers, idlePlayers: idlePlayers, nodeEvent: nodeEvent, stat: stat };
