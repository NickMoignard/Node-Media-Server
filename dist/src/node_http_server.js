//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
var Fs = require('fs');
var path = require('path');
var Http = require('http');
var Https = require('https');
var WebSocket = require('ws');
var Express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var NodeFlvSession = require('./node_flv_session');
var HTTP_PORT = 80;
var HTTPS_PORT = 443;
var HTTP_MEDIAROOT = './media';
var Logger = require('./node_core_logger');
var context = require('./node_core_ctx');
var streamsRoute = require('./api/routes/streams');
var serverRoute = require('./api/routes/server');
var relayRoute = require('./api/routes/relay');
var NodeHttpServer = /** @class */ (function () {
    function NodeHttpServer(config) {
        var _this = this;
        this.port = config.http.port || HTTP_PORT;
        this.mediaroot = config.http.mediaroot || HTTP_MEDIAROOT;
        this.config = config;
        var app = Express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.all('*', function (req, res, next) {
            res.header('Access-Control-Allow-Origin', _this.config.http.allow_origin);
            res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
            res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Credentials', true);
            req.method === 'OPTIONS' ? res.sendStatus(200) : next();
        });
        app.get('*.flv', function (req, res, next) {
            req.nmsConnectionType = 'http';
            _this.onConnect(req, res);
        });
        var adminEntry = path.join(__dirname + '/public/admin/index.html');
        if (Fs.existsSync(adminEntry)) {
            app.get('/admin/*', function (req, res) {
                res.sendFile(adminEntry);
            });
        }
        if (this.config.http.api !== false) {
            if (this.config.auth && this.config.auth.api) {
                app.use(['/api/*', '/static/*', '/admin/*'], basicAuth(this.config.auth.api_user, this.config.auth.api_pass));
            }
            app.use('/api/streams', streamsRoute(context));
            app.use('/api/server', serverRoute(context));
            app.use('/api/relay', relayRoute(context));
        }
        app.use(Express.static(path.join(__dirname + '/public')));
        app.use(Express.static(this.mediaroot));
        if (config.http.webroot) {
            app.use(Express.static(config.http.webroot));
        }
        /**   MIDDLEWARE
        /*    when cls+ requests HLS for a live stream being transmuxed. the HLS EXT-ENDLIST tag will not be present.
        /*    below we are intercepting request to live videos and creating a new HLS manifest for each request.
        /*    This allows the user to treat the video as a VOD.
        /*
        /*    Introducing one hinderance, polling.
        /*    clients will need to request a new manifest if they are to watch new content added after initial request
        */
        // app.get('/live/*', (req, res, next) => {
        //   const matchID = req.path.split('/')[2]
        //   if (matchID) {
        //       fs.open(`${mediaRoot}/live/${matchID}/index.m3u8`, 'a+', (_err, fd) => {
        //         try {
        //           fs.readFile(fd, (_err, data) => {
        //             fs.writeFile(`${mediaRoot}/live/${matchID}/vod.m3u8`, data,'utf-8', () => {
        //               if (data.toString('utf-8').includes('#EXT-X-ENDLIST')) {
        //                 fs.close(fd, err => {
        //                   if (err) throw err
        //                 })
        //                 next()
        //               }
        //               // hls manifest does not contain endlist tag
        //               fs.appendFile(`${mediaRoot}/live/${matchID}/vod.m3u8`, '#EXT-X-ENDLIST', err => {
        //                 if (err) {
        //                   console.log(err)
        //                 } else {
        //                   console.log('Endlist tag added to file')
        //                 }
        //                 fs.close(fd, err => {
        //                   if (err) { throw err } else {
        //                     next()
        //                   }
        //                 })
        //               })
        //             })
        //           })
        //         } catch (err) {
        //           fs.close(fd, err => {
        //             if (err) throw err
        //             next()
        //           })
        //         }
        //       })
        //   }
        // }, Express.static(mediaRoot))
        this.httpServer = Http.createServer(app);
        /**
         * ~ openssl genrsa -out privatekey.pem 1024
         * ~ openssl req -new -key privatekey.pem -out certrequest.csr
         * ~ openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
         */
        if (this.config.https) {
            var options = {
                key: Fs.readFileSync(this.config.https.key),
                cert: Fs.readFileSync(this.config.https.cert)
            };
            this.sport = config.https.port ? config.https.port : HTTPS_PORT;
            this.httpsServer = Https.createServer(options, app);
        }
    }
    NodeHttpServer.prototype.run = function () {
        var _this = this;
        this.httpServer.listen(this.port, function () {
            Logger.log("Node Media Http Server started on port: " + _this.port);
        });
        this.httpServer.on('error', function (e) {
            Logger.error("Node Media Http Server " + e);
        });
        this.httpServer.on('close', function () {
            Logger.log('Node Media Http Server Close.');
        });
        if (this.httpsServer) {
            this.httpsServer.listen(this.sport, function () {
                Logger.log("Node Media Https Server started on port: " + _this.sport);
            });
            this.httpsServer.on('error', function (e) {
                Logger.error("Node Media Https Server " + e);
            });
            this.httpsServer.on('close', function () {
                Logger.log('Node Media Https Server Close.');
            });
            this.wssServer = new WebSocket.Server({ server: this.httpsServer });
            this.wssServer.on('connection', function (ws, req) {
                req.nmsConnectionType = 'ws';
                _this.onConnect(req, ws);
            });
            this.wssServer.on('listening', function () {
                Logger.log("Node Media WebSocketSecure Server started on port: " + _this.sport);
            });
            this.wssServer.on('error', function (e) {
                Logger.error("Node Media WebSocketSecure Server " + e);
            });
        }
        context.nodeEvent.on('postPlay', function (id, args) {
            context.stat.accepted++;
        });
        context.nodeEvent.on('postPublish', function (id, args) {
            context.stat.accepted++;
        });
        context.nodeEvent.on('doneConnect', function (id, args) {
            var session = context.sessions.get(id);
            var socket = session instanceof NodeFlvSession ? session.req.socket : session.socket;
            context.stat.inbytes += socket.bytesRead;
            context.stat.outbytes += socket.bytesWritten;
        });
    };
    NodeHttpServer.prototype.stop = function () {
        this.httpServer.close();
        if (this.httpsServer) {
            this.httpsServer.close();
        }
        context.sessions.forEach(function (session, id) {
            if (session instanceof NodeFlvSession) {
                session.req.destroy();
                context.sessions.delete(id);
            }
        });
    };
    NodeHttpServer.prototype.onConnect = function (req, res) {
        var session = new NodeFlvSession(this.config, req, res);
        session.run();
    };
    return NodeHttpServer;
}());
module.exports = NodeHttpServer;
