/// <reference types="node" />
export = NodeHttpServer;
declare class NodeHttpServer {
    constructor(config: any);
    port: any;
    mediaroot: any;
    config: any;
    /**   MIDDLEWARE
    /*    when cls+ requests HLS for a live stream being transmuxed. the HLS EXT-ENDLIST tag will not be present.
    /*    below we are intercepting request to live videos and creating a new HLS manifest for each request.
    /*    This allows the user to treat the video as a VOD.
    /*
    /*    Introducing one hinderance, polling.
    /*    clients will need to request a new manifest if they are to watch new content added after initial request
    */
    httpServer: Http.Server;
    sport: any;
    httpsServer: Https.Server | undefined;
    run(): void;
    wsServer: WebSocket.Server | undefined;
    wssServer: WebSocket.Server | undefined;
    stop(): void;
    onConnect(req: any, res: any): void;
}
import Http = require("http");
import Https = require("https");
import WebSocket = require("ws");
