var Bitop = /** @class */ (function () {
    function Bitop(buffer) {
        this.buffer = buffer;
        this.buflen = buffer.length;
        this.bufpos = 0;
        this.bufoff = 0;
        this.iserro = false;
    }
    Bitop.prototype.read = function (n) {
        var v = 0;
        var d = 0;
        while (n) {
            if (n < 0 || this.bufpos >= this.buflen) {
                this.iserro = true;
                return 0;
            }
            this.iserro = false;
            d = this.bufoff + n > 8 ? 8 - this.bufoff : n;
            v <<= d;
            v += (this.buffer[this.bufpos] >> (8 - this.bufoff - d)) & (0xff >> (8 - d));
            this.bufoff += d;
            n -= d;
            if (this.bufoff == 8) {
                this.bufpos++;
                this.bufoff = 0;
            }
        }
        return v;
    };
    Bitop.prototype.look = function (n) {
        var p = this.bufpos;
        var o = this.bufoff;
        var v = this.read(n);
        this.bufpos = p;
        this.bufoff = o;
        return v;
    };
    Bitop.prototype.read_golomb = function () {
        var n;
        for (n = 0; this.read(1) == 0 && !this.iserro; n++)
            ;
        return (1 << n) + this.read(n) - 1;
    };
    return Bitop;
}());
module.exports = Bitop;
