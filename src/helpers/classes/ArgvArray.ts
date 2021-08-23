class ArgvArray {
    _list: Array<string>
    constructor(list: Array<string>) {
        this._list = list
    }
    get list() {
        return this._list.map(n => n)
    }
    set list(list: Array<string>) {
        this._list = list
    }
    add(list: Array<string>) {
        Array.prototype.push.apply(this._list, list)
    }
}

export default ArgvArray