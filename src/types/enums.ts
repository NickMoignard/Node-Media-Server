export enum RTMP_CODES {
  started = 11,
  finished = 12,
  data = 13,
  error = 14,
}

export enum HLS_CODES {
  started = 11,
  finished = 12,
  data = 13,
  error = 14,
}

export enum RSTPTransportEnum {
  udp = 'udp',
  tcp = 'tcp',
  udp_multicast = 'udp_multicast',
  http = 'http'
}

export enum CLIENT_ACTIONS {
  startRec = 'START_REC', // Create folders + files and start recording
  stopRec = 'STOP_REC', // Stop recording, Consolodate files and transfer to S3
  resetRect = 'RESET_REC', // Delete local files for match
  pauseRec = 'PAUSE_REC', // Stop Recording. Insert discontenuity tag
  unpauseRec = 'UNPAUSE_REC' // Start recording again + new files + folders
}

export enum WS_ERROR_CODES {
  // A WebSocket frame was received with the FIN bit not set when it was expected.
  expectedFin = 'WS_ERR_EXPECTED_FIN',

  // An unmasked WebSocket frame was received by a WebSocket server.
  expectedMask = 'WS_ERR_EXPECTED_MASK',

  // A WebSocket close frame was received with an invalid close code.
  invalidCloseCode = 'WS_ERR_INVALID_CLOSE_CODE',

  // A control frame with an invalid payload length was received.
  invalidControlPayloadLength = 'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH',

  // A WebSocket frame was received with an invalid opcode.
  invalidOPCode = 'WS_ERR_INVALID_OPCODE',

  // A text or close frame was received containing invalid UTF-8 data.
  invalidUtf8 = 'WS_ERR_INVALID_UTF8',

  // A masked WebSocket frame was received by a WebSocket client.
  unexpectedMask = 'WS_ERR_UNEXPECTED_MASK',

  // A WebSocket frame was received with the RSV1 bit set unexpectedly.
  unexpectedRsv_1 = 'WS_ERR_UNEXPECTED_RSV_1',

  // A WebSocket frame was received with the RSV2 or RSV3 bit set unexpectedly.
  unexpectedRsv_2_3 = 'WS_ERR_UNEXPECTED_RSV_2_3',

  // A data frame was received with a length longer than the max supported length (2^53 - 1, due to JavaScript language limitations).
  unsupoortedDataPayloadLength = 'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH',

  // A message was received with a length longer than the maximum supported length, as configured by the maxPayload option.
  unsupportedMsgLength = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
}