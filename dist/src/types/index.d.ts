import { RSTPTransportEnum } from "./enums";
export interface RTMPConf {
    port: number;
    chunk_size: number;
    gop_cache: true;
    ping: number;
    ping_timeout: number;
}
export interface AuthConf {
    play?: boolean;
    publish?: boolean;
    secret?: string;
    api?: boolean;
    api_user?: string;
    api_password?: string;
}
export interface HTTPConf {
    port: number;
    mediaroot: string;
    allow_origin: string;
}
export interface HTTPSConf {
    port: number;
    key: string;
    cert: string;
}
export declare type StreamConf = {
    ffmpeg: string;
    mediaroot: string;
    streamPath?: string;
    streamName?: string;
    streamApp?: string;
    app?: string;
    args?: string | string[];
};
export interface BaseTaskConf {
    app: string;
    mode: string;
}
export interface RelayTaskConf extends BaseTaskConf {
    name: string;
    edge: string;
    rstp_transport?: RSTPTransportEnum;
}
export interface TmuxTaskConf {
    vc?: string;
    vcParams?: string[];
    ac?: string;
    acParam?: string[];
    rtmp?: boolean;
    rtmpApp?: string;
    dash?: boolean;
    dashFlags?: string;
    hls?: boolean;
    hlsFlags?: string;
}
export declare type TaskConf = RelayTaskConf | TmuxTaskConf;
export interface TransConf {
    ffmpeg: string;
    tasks: TaskConf[];
}
export interface NodeMediaServerConfig {
    rtmp?: RTMPConf;
    auth?: AuthConf;
    http?: HTTPConf;
    https?: HTTPSConf;
    stream?: StreamConf;
    trans?: TransConf;
    logType?: number;
    fission?: any;
    cluster?: any;
    relay?: any;
}
