"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_ERROR_CODES = exports.CLIENT_ACTIONS = exports.RSTPTransportEnum = exports.HLS_CODES = exports.RTMP_CODES = void 0;
var RTMP_CODES;
(function (RTMP_CODES) {
    RTMP_CODES[RTMP_CODES["started"] = 11] = "started";
    RTMP_CODES[RTMP_CODES["finished"] = 12] = "finished";
    RTMP_CODES[RTMP_CODES["data"] = 13] = "data";
    RTMP_CODES[RTMP_CODES["error"] = 14] = "error";
})(RTMP_CODES = exports.RTMP_CODES || (exports.RTMP_CODES = {}));
var HLS_CODES;
(function (HLS_CODES) {
    HLS_CODES[HLS_CODES["started"] = 11] = "started";
    HLS_CODES[HLS_CODES["finished"] = 12] = "finished";
    HLS_CODES[HLS_CODES["data"] = 13] = "data";
    HLS_CODES[HLS_CODES["error"] = 14] = "error";
})(HLS_CODES = exports.HLS_CODES || (exports.HLS_CODES = {}));
var RSTPTransportEnum;
(function (RSTPTransportEnum) {
    RSTPTransportEnum["udp"] = "udp";
    RSTPTransportEnum["tcp"] = "tcp";
    RSTPTransportEnum["udp_multicast"] = "udp_multicast";
    RSTPTransportEnum["http"] = "http";
})(RSTPTransportEnum = exports.RSTPTransportEnum || (exports.RSTPTransportEnum = {}));
var CLIENT_ACTIONS;
(function (CLIENT_ACTIONS) {
    CLIENT_ACTIONS["startRec"] = "START_REC";
    CLIENT_ACTIONS["stopRec"] = "STOP_REC";
    CLIENT_ACTIONS["resetRect"] = "RESET_REC";
    CLIENT_ACTIONS["pauseRec"] = "PAUSE_REC";
    CLIENT_ACTIONS["unpauseRec"] = "UNPAUSE_REC"; // Start recording again + new files + folders
})(CLIENT_ACTIONS = exports.CLIENT_ACTIONS || (exports.CLIENT_ACTIONS = {}));
var WS_ERROR_CODES;
(function (WS_ERROR_CODES) {
    // A WebSocket frame was received with the FIN bit not set when it was expected.
    WS_ERROR_CODES["expectedFin"] = "WS_ERR_EXPECTED_FIN";
    // An unmasked WebSocket frame was received by a WebSocket server.
    WS_ERROR_CODES["expectedMask"] = "WS_ERR_EXPECTED_MASK";
    // A WebSocket close frame was received with an invalid close code.
    WS_ERROR_CODES["invalidCloseCode"] = "WS_ERR_INVALID_CLOSE_CODE";
    // A control frame with an invalid payload length was received.
    WS_ERROR_CODES["invalidControlPayloadLength"] = "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH";
    // A WebSocket frame was received with an invalid opcode.
    WS_ERROR_CODES["invalidOPCode"] = "WS_ERR_INVALID_OPCODE";
    // A text or close frame was received containing invalid UTF-8 data.
    WS_ERROR_CODES["invalidUtf8"] = "WS_ERR_INVALID_UTF8";
    // A masked WebSocket frame was received by a WebSocket client.
    WS_ERROR_CODES["unexpectedMask"] = "WS_ERR_UNEXPECTED_MASK";
    // A WebSocket frame was received with the RSV1 bit set unexpectedly.
    WS_ERROR_CODES["unexpectedRsv_1"] = "WS_ERR_UNEXPECTED_RSV_1";
    // A WebSocket frame was received with the RSV2 or RSV3 bit set unexpectedly.
    WS_ERROR_CODES["unexpectedRsv_2_3"] = "WS_ERR_UNEXPECTED_RSV_2_3";
    // A data frame was received with a length longer than the max supported length (2^53 - 1, due to JavaScript language limitations).
    WS_ERROR_CODES["unsupoortedDataPayloadLength"] = "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH";
    // A message was received with a length longer than the maximum supported length, as configured by the maxPayload option.
    WS_ERROR_CODES["unsupportedMsgLength"] = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
})(WS_ERROR_CODES = exports.WS_ERROR_CODES || (exports.WS_ERROR_CODES = {}));
