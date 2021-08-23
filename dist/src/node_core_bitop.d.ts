export = Bitop;
declare class Bitop {
    constructor(buffer: any);
    buffer: any;
    buflen: any;
    bufpos: number;
    bufoff: number;
    iserro: boolean;
    read(n: any): number;
    look(n: any): number;
    read_golomb(): number;
}
