export declare enum RTMP_CODES {
    started = 11,
    finished = 12,
    data = 13,
    error = 14
}
export declare enum HLS_CODES {
    started = 11,
    finished = 12,
    data = 13,
    error = 14
}
export declare enum RSTPTransportEnum {
    udp = "udp",
    tcp = "tcp",
    udp_multicast = "udp_multicast",
    http = "http"
}
export declare enum CLIENT_ACTIONS {
    startRec = "START_REC",
    stopRec = "STOP_REC",
    resetRect = "RESET_REC",
    pauseRec = "PAUSE_REC",
    unpauseRec = "UNPAUSE_REC"
}
export declare enum WS_ERROR_CODES {
    expectedFin = "WS_ERR_EXPECTED_FIN",
    expectedMask = "WS_ERR_EXPECTED_MASK",
    invalidCloseCode = "WS_ERR_INVALID_CLOSE_CODE",
    invalidControlPayloadLength = "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH",
    invalidOPCode = "WS_ERR_INVALID_OPCODE",
    invalidUtf8 = "WS_ERR_INVALID_UTF8",
    unexpectedMask = "WS_ERR_UNEXPECTED_MASK",
    unexpectedRsv_1 = "WS_ERR_UNEXPECTED_RSV_1",
    unexpectedRsv_2_3 = "WS_ERR_UNEXPECTED_RSV_2_3",
    unsupoortedDataPayloadLength = "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH",
    unsupportedMsgLength = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
}
