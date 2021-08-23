/**
 *
 * @param dbuf
 * @returns {{}}
 */
declare function decodeAMF3Cmd(dbuf: any): {};
/**
 * Encode AMF3 Command
 * @param opt
 * @returns {*}
 */
declare function encodeAMF3Cmd(opt: any): any;
/**
 * Decode a command!
 * @param dbuf
 * @returns {{cmd: (*|string|String|*), value: *}}
 */
declare function decodeAMF0Cmd(dbuf: any): {
    cmd: (any | string | string | any);
    value: any;
};
/**
 * Encode AMF0 Command
 * @param opt
 * @returns {*}
 */
declare function encodeAMF0Cmd(opt: any): any;
/**
 * Decode a data!
 * @param dbuf
 * @returns {{cmd: (*|string|String|*), value: *}}
 */
export function decodeAmf0Data(dbuf: any): {
    cmd: (any | string | string | any);
    value: any;
};
declare function encodeAMF0Data(opt: any): any;
export function amfType(o: any): "object" | "string" | "integer" | "undefined" | "null" | "double" | "true" | "false" | "sarray" | "array";
/**
 * Encode an array of values into a buffer
 * @param a
 * @returns {Buffer}
 */
export function amf0Encode(a: any): Buffer;
/**
 * Encode one AMF0 value
 * @param o
 * @returns {*}
 */
export function amf0EncodeOne(o: any): any;
/**
 * Decode a buffer of AMF0 values
 * @param buffer
 * @returns {Array}
 */
export function amf0Decode(buffer: any): any[];
/**
 * Decode one AMF0 value
 * @param buffer
 * @returns {*}
 */
export function amf0DecodeOne(buffer: any): any;
/**
 * Encode an array of values into a buffer
 * @param a
 * @returns {Buffer}
 */
export function amf3Encode(a: any): Buffer;
/**
 * Encode one AMF3 value
 * @param o
 * @returns {*}
 */
export function amf3EncodeOne(o: any): any;
/**
 * Decode a buffer of AMF3 values
 * @param buffer
 * @returns {Array}
 */
export function amf3Decode(buffer: any): any[];
/**
 * Decode one AMF3 value
 * @param buffer
 * @returns {*}
 */
export function amf3DecodeOne(buffer: any): any;
/**
 * AMF0 Encode Binary Array into binary Object
 * @param aData
 * @returns {Buffer}
 */
declare function amf0cnletray2Object(aData: any): Buffer;
/**
 * AMF0 Encode Binary Object into binary Array
 * @param oData
 * @returns {Buffer}
 */
declare function amf0cnvObject2Array(oData: any): Buffer;
export function amf0markSArray(a: any): any;
/**
 * AMF0 Decode Array
 * @param buf
 * @returns {{len: *, value: ({}|*)}}
 */
export function amf0decArray(buf: any): {
    len: any;
    value: ({} | any);
};
/**
 * AMF0 Decode Boolean
 * @param buf
 * @returns {{len: number, value: boolean}}
 */
export function amf0decBool(buf: any): {
    len: number;
    value: boolean;
};
/**
 * AMF0 Decode Date
 * @param buf
 * @returns {{len: number, value: (*|Number)}}
 */
export function amf0decDate(buf: any): {
    len: number;
    value: (any | number);
};
/**
 * AMF0 Decode Long String
 * @param buf
 * @returns {{len: *, value: (*|string|String)}}
 */
export function amf0decLongString(buf: any): {
    len: any;
    value: (any | string | string);
};
/**
 * AMF0 Decode Null
 * @returns {{len: number, value: null}}
 */
export function amf0decNull(): {
    len: number;
    value: null;
};
/**
 * AMF0 Decode Number
 * @param buf
 * @returns {{len: number, value: (*|Number)}}
 */
export function amf0decNumber(buf: any): {
    len: number;
    value: (any | number);
};
/**
 * AMF0 Decode Object
 * @param buf
 * @returns {{len: number, value: {}}}
 */
export function amf0decObject(buf: any): {
    len: number;
    value: {};
};
/**
 * AMF0 Decode Reference
 * @param buf
 * @returns {{len: number, value: string}}
 */
export function amf0decRef(buf: any): {
    len: number;
    value: string;
};
/**
 * AMF0 Decode Strict Array
 * @param buf
 * @returns {{len: number, value: Array}}
 */
export function amf0decSArray(buf: any): {
    len: number;
    value: any[];
};
/**
 * AMF0 Decode String
 * @param buf
 * @returns {{len: *, value: (*|string|String)}}
 */
export function amf0decString(buf: any): {
    len: any;
    value: (any | string | string);
};
/**
 * AMF0 Decode Typed Object
 * @param buf
 * @returns {{len: number, value: ({}|*)}}
 */
export function amf0decTypedObj(buf: any): {
    len: number;
    value: ({} | any);
};
/**
 * AMF0 Decode Undefined
 * @returns {{len: number, value: undefined}}
 */
export function amf0decUndefined(): {
    len: number;
    value: undefined;
};
/**
 * AMF0 Decode XMLDoc
 * @param buf
 * @returns {{len: *, value: (*|string|String)}}
 */
export function amf0decXmlDoc(buf: any): {
    len: any;
    value: (any | string | string);
};
/**
 * AMF0 Encode Array
 */
export function amf0encArray(a: any): Buffer;
/**
 * AMF0 Encode Boolean
 * @param num
 * @returns {Buffer}
 */
export function amf0encBool(num: any): Buffer;
/**
 * AMF0 Encode Date
 * @param ts
 * @returns {Buffer}
 */
export function amf0encDate(ts: any): Buffer;
/**
 * AMF0 Encode Long String
 * @param str
 * @returns {Buffer}
 */
export function amf0encLongString(str: any): Buffer;
/**
 * AMF0 Encode Null
 * @returns {Buffer}
 */
export function amf0encNull(): Buffer;
/**
 * AMF0 Encode Number
 * @param num
 * @returns {Buffer}
 */
export function amf0encNumber(num: any): Buffer;
/**
 * AMF0 Encode Object
 */
export function amf0encObject(o: any): Buffer;
/**
 * AMF0 Encode Reference
 * @param index
 * @returns {Buffer}
 */
export function amf0encRef(index: any): Buffer;
/**
 * AMF0 Encode Strict Array
 * @param a Array
 */
export function amf0encSArray(a: any): Buffer;
/**
 * AMF0 Encode String
 * @param str
 * @returns {Buffer}
 */
export function amf0encString(str: any): Buffer;
/**
 * AMF0 Encode Typed Object
 */
export function amf0encTypedObj(): void;
/**
 * AMF0 Encode Undefined
 * @returns {Buffer}
 */
export function amf0encUndefined(): Buffer;
/**
 * AMF0 Encode XMLDoc
 * @param str
 * @returns {Buffer}
 */
export function amf0encXmlDoc(str: any): Buffer;
/**
 * AMF3 Decode Array
 * @param buf
 * @returns {{len: *, value: *}}
 */
export function amf3decArray(buf: any): {
    len: any;
    value: any;
};
/**
 * AMF3 Decide Byte Array
 * @param buf
 * @returns {{len: *, value: (Array|string|*|Buffer|Blob)}}
 */
export function amf3decByteArray(buf: any): {
    len: any;
    value: (any[] | string | any | Buffer | Blob);
};
/**
 * AMF3 Decode Date
 * @param buf
 * @returns {{len: *, value: (*|Number)}}
 */
export function amf3decDate(buf: any): {
    len: any;
    value: (any | number);
};
/**
 * AMF3 Decode Double
 * @param buf
 * @returns {{len: number, value: (*|Number)}}
 */
export function amf3decDouble(buf: any): {
    len: number;
    value: (any | number);
};
/**
 * AMF3 Decode false
 * @returns {{len: number, value: boolean}}
 */
export function amf3decFalse(): {
    len: number;
    value: boolean;
};
/**
 * AMF3 Decode an integer
 * @param buf
 * @returns {{len: number, value: number}}
 */
export function amf3decInteger(buf: any): {
    len: number;
    value: number;
};
/**
 * AMF3 Decode null
 * @returns {{len: number, value: null}}
 */
export function amf3decNull(): {
    len: number;
    value: null;
};
/**
 * AMF3 Decode Object
 * @param buf
 */
export function amf3decObject(buf: any): {};
/**
 * AMF3 Decode String
 * @param buf
 * @returns {{len: *, value: (*|String)}}
 */
export function amf3decString(buf: any): {
    len: any;
    value: (any | string);
};
/**
 * AMF3 Decode true
 * @returns {{len: number, value: boolean}}
 */
export function amf3decTrue(): {
    len: number;
    value: boolean;
};
/**
 * Generic decode of AMF3 UInt29 values
 * @param buf
 * @returns {{len: number, value: number}}
 */
export function amf3decUI29(buf: any): {
    len: number;
    value: number;
};
/**
 * AMF3 Decode undefined value
 * @returns {{len: number, value: undefined}}
 */
export function amf3decUndefined(): {
    len: number;
    value: undefined;
};
/**
 * AMF3 Decode Generic XML
 * @param buf
 * @returns {{len: *, value: (*|String)}}
 */
export function amf3decXml(buf: any): {
    len: any;
    value: (any | string);
};
/**
 * AMF3 Decode XMLDoc
 * @param buf
 * @returns {{len: *, value: (*|String)}}
 */
export function amf3decXmlDoc(buf: any): {
    len: any;
    value: (any | string);
};
/**
 * AMF3 Encode Array
 */
export function amf3encArray(): void;
/**
 * AMF3 Encode Byte Array
 * @param str
 * @returns {Buffer}
 */
export function amf3encByteArray(str: any): Buffer;
/**
 * AMF3 Encode Date
 * @param ts
 * @returns {Buffer}
 */
export function amf3encDate(ts: any): Buffer;
/**
 * AMF3 Encode Double
 * @param num
 * @returns {Buffer}
 */
export function amf3encDouble(num: any): Buffer;
/**
 * AMF3 Encode false
 * @returns {Buffer}
 */
export function amf3encFalse(): Buffer;
/**
 * AMF3 Encode an integer
 * @param num
 * @returns {Buffer}
 */
export function amf3encInteger(num: any): Buffer;
/**
 * AMF3 Encode null
 * @returns {Buffer}
 */
export function amf3encNull(): Buffer;
/**
 * AMF3 Encode Object
 * @param o
 */
export function amf3encObject(o: any): void;
/**
 * AMF3 Encode String
 * @param str
 * @returns {Buffer}
 */
export function amf3encString(str: any): Buffer;
/**
 * AMF3 Encode true
 * @returns {Buffer}
 */
export function amf3encTrue(): Buffer;
/**
 * Generic encode of AMF3 UInt29 value
 * @param num
 * @returns {Buffer}
 */
export function amf3encUI29(num: any): Buffer;
/**
 * AMF3 Encode undefined value
 * @returns {Buffer}
 */
export function amf3encUndefined(): Buffer;
/**
 * AMF3 Encode Generic XML
 * @param str
 * @returns {Buffer}
 */
export function amf3encXml(str: any): Buffer;
/**
 * AMF3 Encode XMLDoc
 * @param str
 * @returns {Buffer}
 */
export function amf3encXmlDoc(str: any): Buffer;
export { decodeAMF3Cmd as decodeAmf3Cmd, encodeAMF3Cmd as encodeAmf3Cmd, decodeAMF0Cmd as decodeAmf0Cmd, encodeAMF0Cmd as encodeAmf0Cmd, encodeAMF0Data as encodeAmf0Data, amf0cnletray2Object as amf0cnvA2O, amf0cnvObject2Array as amf0cnvO2A };
