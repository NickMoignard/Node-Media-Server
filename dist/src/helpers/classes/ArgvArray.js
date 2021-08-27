"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ArgvArray = /** @class */ (function () {
    function ArgvArray(list) {
        this._list = list;
    }
    Object.defineProperty(ArgvArray.prototype, "list", {
        get: function () {
            return this._list.map(function (n) { return n; });
        },
        set: function (list) {
            this._list = list;
        },
        enumerable: false,
        configurable: true
    });
    ArgvArray.prototype.add = function (list) {
        Array.prototype.push.apply(this._list, list);
    };
    return ArgvArray;
}());
exports.default = ArgvArray;
