declare class ArgvArray {
    _list: Array<string>;
    constructor(list: Array<string>);
    get list(): Array<string>;
    set list(list: Array<string>);
    add(list: Array<string>): void;
}
export default ArgvArray;
