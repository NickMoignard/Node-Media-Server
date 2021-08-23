export = NodeRtmpSession;
declare class NodeRtmpSession {
    constructor(config: any, socket: any);
    config: any;
    socket: any;
    res: any;
    id: string;
    ip: any;
    TAG: string;
    handshakePayload: Buffer;
    handshakeState: number;
    handshakeBytes: number;
    parserBuffer: Buffer;
    parserState: number;
    parserBytes: number;
    parserBasicBytes: number;
    parserPacket: any;
    inPackets: Map<any, any>;
    inChunkSize: number;
    outChunkSize: any;
    pingTime: number;
    pingTimeout: number;
    pingInterval: NodeJS.Timer | null;
    isLocal: boolean;
    isStarting: boolean;
    isPublishing: boolean;
    isPlaying: boolean;
    isIdling: boolean;
    isPause: boolean;
    isReceiveAudio: boolean;
    isReceiveVideo: boolean;
    metaData: any;
    aacSequenceHeader: Buffer | null;
    avcSequenceHeader: Buffer | null;
    audioCodec: number;
    audioCodecName: string;
    audioProfileName: string;
    audioSamplerate: number;
    audioChannels: number;
    videoCodec: number;
    videoCodecName: string;
    videoProfileName: string;
    videoWidth: number;
    videoHeight: number;
    videoFps: number;
    videoCount: number;
    videoLevel: number;
    bitrate: number;
    gopCacheEnable: any;
    rtmpGopCacheQueue: Set<any> | null;
    flvGopCacheQueue: Set<any> | null;
    ackSize: number;
    inAckSize: number;
    inLastAck: number;
    appname: string;
    streams: number;
    playStreamId: number;
    playStreamPath: string;
    playArgs: {};
    publishStreamId: number;
    publishStreamPath: string;
    publishArgs: {};
    players: Set<any>;
    numPlayCache: number;
    bitrateCache: {};
    run(): void;
    stop(): void;
    reject(): void;
    flush(): void;
    onSocketClose(): void;
    onSocketError(e: any): void;
    onSocketTimeout(): void;
    /**
     * onSocketData
     * @param {Buffer} data
     * @returns
     */
    onSocketData(data: Buffer): void;
    rtmpChunkBasicHeaderCreate(fmt: any, cid: any): Buffer;
    rtmpChunkMessageHeaderCreate(header: any): Buffer;
    /**
     * rtmpChunksCreate
     * @param {RtmpPacket} packet
     * @returns
     */
    rtmpChunksCreate(packet: {
        create: (fmt?: number, cid?: number) => {
            header: {
                fmt: number;
                cid: number;
                timestamp: number;
                length: number;
                type: number;
                stream_id: number;
            };
            clock: number;
            payload: null;
            capacity: number;
            bytes: number;
        };
    }): Buffer;
    /**
     * rtmpChunkRead
     * @param {Buffer} data
     * @param {Number} p
     * @param {Number} bytes
     */
    rtmpChunkRead(data: Buffer, p: number, bytes: number): void;
    rtmpPacketParse(): void;
    rtmpChunkMessageHeaderRead(): number;
    rtmpPacketAlloc(): void;
    rtmpHandler(): void | 0 | -1;
    rtmpControlHandler(): void;
    rtmpEventHandler(): void;
    rtmpAudioHandler(): void;
    isFirstAudioReceived: boolean | undefined;
    rtmpVideoHandler(): void;
    rtmpDataHandler(): void;
    rtmpInvokeHandler(): void;
    sendACK(size: any): void;
    sendWindowACK(size: any): void;
    setPeerBandwidth(size: any, type: any): void;
    setChunkSize(size: any): void;
    sendStreamStatus(st: any, id: any): void;
    sendInvokeMessage(sid: any, opt: any): void;
    sendDataMessage(opt: any, sid: any): void;
    sendStatusMessage(sid: any, level: any, code: any, description: any): void;
    sendRtmpSampleAccess(sid: any): void;
    sendPingRequest(): void;
    respondConnect(tid: any): void;
    respondCreateStream(tid: any): void;
    respondPlay(): void;
    onConnect(invokeMessage: any): void;
    connectCmdObj: any;
    objectEncoding: any;
    connectTime: Date | undefined;
    startTimestamp: number | undefined;
    onCreateStream(invokeMessage: any): void;
    onPublish(invokeMessage: any): void;
    onPlay(invokeMessage: any): void;
    onStartPlay(): void;
    onPause(invokeMessage: any): void;
    onReceiveAudio(invokeMessage: any): void;
    onReceiveVideo(invokeMessage: any): void;
    onCloseStream(): void;
    onDeleteStream(invokeMessage: any): void;
}
