export const AUDIO_SOUND_RATE: number[];
export const AUDIO_CODEC_NAME: string[];
export const VIDEO_CODEC_NAME: string[];
export function readAACSpecificConfig(aacSequenceHeader: any): {
    object_type: any;
    sample_rate: any;
    chan_config: number;
    channels: number;
    sbr: number;
    ps: number;
    ext_object_type: number;
};
export function getAACProfileName(info: any): "" | "Main" | "HEv2" | "HE" | "LC" | "SSR" | "LTP" | "SBR";
export function readAVCSpecificConfig(avcSequenceHeader: any): {
    width: number;
    height: number;
    profile: number;
    compat: number;
    level: any;
    nalu: number;
    nb_sps: number;
    avc_ref_frames: number;
} | {
    width: number;
    height: number;
    profile: number;
    level: number;
};
export function getAVCProfileName(info: any): "" | "Main" | "Main 10" | "Main Still Picture" | "Baseline" | "High";
