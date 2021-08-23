import CodecParams from "./CodecParams";
export declare class VideoBitrate {
    rate: string;
    max: string;
    min: string;
    buffer: string;
    constructor(rate: string, max: string, min: string, buffer: string);
    forExec(index: number): string[];
}
export declare class VideoConfig {
    w: number;
    h: number;
    audio_codec: string;
    audio_bitrate: string;
    audio_channels: number;
    video_codec: string;
    video_bitrate: VideoBitrate;
    codecParams: CodecParams;
    preset: string;
    g: number;
    sc_threshold: number;
    keyint_min: number;
    constructor(w: number, h: number, ab: string, vb: VideoBitrate, aChannels?: number, ac?: string, vc?: string, codecParams?: CodecParams, preset?: string, g?: number, sc_threshold?: number, keyint_min?: number);
    vidOutputArgs: (index: number) => Array<string>;
    aOutputArgs: (index: number) => Array<string>;
}
export declare class FilterComplexConfig {
    _versions: Array<VideoConfig>;
    constructor(vers?: Array<VideoConfig>);
    get versions(): Array<VideoConfig>;
    set versions(vers: Array<VideoConfig>);
    filterComplexArgs: () => Array<string>;
}
