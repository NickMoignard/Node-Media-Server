class ArgvArray {
    #list: Array<string>
    constructor(list: Array<string>) {
        this.#list = list
    }
    get list() {
        return this.#list.map(n => n)
    }
    set list(list: Array<string>) {
        this.#list = list
    }
    add(list: Array<string>) {
        Array.prototype.push.apply(this.#list, list)
    }
}

export default ArgvArray