declare class CodecParams {
    flag: string;
    paramString: string;
    constructor(flag?: string, params?: string);
    forExec(): string[];
}
export default CodecParams;
