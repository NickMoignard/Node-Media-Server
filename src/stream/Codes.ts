export const WS_CODES = {
    rtmp: {
        start: 11,
        finished: 12,
        data: 13,
        error: 14,
    },
    hls: {
        started: 21,
        finished: 22,
        data: 23,
        error: 24,
    }
}

export const CLIENT_ACTIONS = [
    'START_REC', // Create folders + files and start recording
    'STOP_REC', // Stop recording, Consolodate files and transfer to S3
    'RESET_REC', // Delete local files for match
    'PAUSE_REC', // Stop Recording. Insert discontenuity tag
    'UNPAUSE_REC' // Start recording again + new files + folders
]
