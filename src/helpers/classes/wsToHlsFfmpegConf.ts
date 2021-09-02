/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */
import ffmpeg from 'ffmpeg-static'

export class ffmpegConfigInterface {
  source: string

  streamPath: string

  // method?: string
  // segment_filename: string
  scale?: {
    w: number
    h: number
  }

  ffmpeg_flags?: string[]

  hwaccel?: string

  hwaccel_output_format?: string

  max_bitrate_ratio?: number

  key_frames_interval?: number

  vsync?: number

  qmin?: number

  temporalAQ?: number

  rcLookahead?: number

  vb?: number // video buffer in kilobytes

  bf?: number

  vc?: string

  iQfactor?: number

  bQfactor?: number

  video_profile?: string

  tune?: string

  video_codec_preset?: string

  rate_control_preset?: string

  sc_threshold?: number

  hls_flags?: string

  hls_list_size?: number

  strftime?: number

  hls_time?: number

  audio_codec?: string

  hls_playlist_type?: string

  hls_segment_type?: string

  filetype?: string

  master_playlist_name?: string
}

export class rtmpHevcConfig extends ffmpegConfigInterface {
  constructor(streamPath: string, config?: ffmpegConfigInterface) {
    super()
    this.streamPath = streamPath
    this.source = `rtmp://127.0.0.1:1935${streamPath}`

    this.scale = config?.scale || { w: 1280, h: 720 }
    this.filetype = config?.filetype || 'hls'
    this.hwaccel = config?.hwaccel || 'cuda'
    this.hwaccel_output_format = config?.hwaccel_output_format || 'cuda'
    this.audio_codec = config?.audio_codec || 'copy'
    this.max_bitrate_ratio = config?.max_bitrate_ratio || 1.07
    this.key_frames_interval = config?.key_frames_interval || 48
    this.vsync = config?.vsync || 0
    this.qmin = config?.qmin || 0
    this.temporalAQ = config?.temporalAQ || 1
    this.rcLookahead = config?.rcLookahead || 20
    this.vb = config?.vb || 5000
    this.bf = config?.bf || 2
    this.vc = config?.vc || 'hevc_nvenc'
    this.iQfactor = config?.iQfactor || 0.75
    this.bQfactor = config?.bQfactor || 1.1
    this.video_profile = config?.video_profile || 'main'
    this.tune = config?.tune || 'hq'
    this.video_codec_preset = config?.video_codec_preset || 'llhq'
    this.rate_control_preset = config?.rate_control_preset || 'vbr_hq'
    this.sc_threshold = config?.sc_threshold || 0
    this.hls_flags =
      config?.hls_flags ||
      'append_list+independent_segments+program_date_time+second_level_segment_index'
    this.hls_list_size = config?.hls_list_size || 0
    this.strftime = config?.strftime || 1
    this.hls_time = config?.hls_time || 2
    this.hls_playlist_type = config?.hls_playlist_type || 'vod'
    this.hls_segment_type = config?.hls_segment_type || 'mpegts'
    // this.method = config?.method || 'PUT'
    this.master_playlist_name = config?.master_playlist_name || 'playlist.m3u8'
    this.ffmpeg_flags = config?.ffmpeg_flags || ['-y']
  }

  args(mediaroot: string) {
    const segment_filename = `${mediaroot}${this.streamPath}/${this.scale.h}p_%Y%m%d-%%04d.ts`
    const outpath = `${mediaroot}${this.streamPath}/${this.scale.h}p.m3u8`
    const remaining_params = [
      // vsync:
      '-vsync',
      this.vsync,
      // hardware_acceleration
      '-hwaccel',
      this.hwaccel,
      // hardware_acceleration_output_format
      '-hwaccel_output_format',
      this.hwaccel_output_format, // keeps decoded frames in GPU memory
      // input
      '-i',
      this.source,
      '-resize',
      `${this.scale.w}x${this.scale.h}`,
      '-c:a',
      this.audio_codec,
      '-c:v',
      this.vc,
      '-preset',
      this.video_codec_preset,
      '-tune',
      this.tune,
      '-profile:v',
      this.video_profile,
      '-b:v',
      `${this.vb}k`,
      '-bufsize',
      `${this.vb}k`,
      '-maxrate',
      `10M`,
      '-qmin',
      this.qmin,
      '-g',
      this.key_frames_interval,
      // '-bf', this.bf,
      // '-temporal-aq', this.temporalAQ,
      // '-rc-lookahead', this.rcLookahead,
      // '-rc', this.rate_control_preset,
      // '-i_qfactor', this.iQfactor,
      // '-b_qfactor', this.bQfactor,
      // OUTPUT
      '-f',
      this.filetype,
      '-hls_flags',
      this.hls_flags,
      '-hls_list_size',
      this.hls_list_size,
      '-hls_time',
      this.hls_time,
      '-strftime',
      this.strftime,
      '-hls_playlist_type',
      this.hls_playlist_type,
      '-hls_segment_type',
      this.hls_segment_type,
      '-hls_segment_filename',
      segment_filename,
      // '-method', this.method,
      '-master_pl_name',
      'playlist.m3u8',
      outpath,
    ]
    Array.prototype.push.apply(this.ffmpeg_flags, remaining_params)
    return this.ffmpeg_flags
  }

  argString(mediaroot: string) {
    return this.args(mediaroot).join(' ')
  }
}

export class WSHevcConfig extends ffmpegConfigInterface {
  constructor(streamPath: string, config?: ffmpegConfigInterface) {
    super()
    this.streamPath = streamPath
    this.source = '-'

    this.scale = config?.scale || { w: 1280, h: 720 }
    this.filetype = config?.filetype || 'hls'
    this.hwaccel = config?.hwaccel || 'cuda'
    this.hwaccel_output_format = config?.hwaccel_output_format || 'cuda'
    this.audio_codec = config?.audio_codec || 'copy'
    this.max_bitrate_ratio = config?.max_bitrate_ratio || 1.07
    this.key_frames_interval = config?.key_frames_interval || 48
    this.vsync = config?.vsync || 0
    this.qmin = config?.qmin || 0
    this.temporalAQ = config?.temporalAQ || 1
    this.rcLookahead = config?.rcLookahead || 20
    this.vb = config?.vb || 5000
    this.bf = config?.bf || 2
    this.vc = config?.vc || 'hevc_nvenc'
    this.iQfactor = config?.iQfactor || 0.75
    this.bQfactor = config?.bQfactor || 1.1
    this.video_profile = config?.video_profile || 'main'
    this.tune = config?.tune || 'hq'
    this.video_codec_preset = config?.video_codec_preset || 'p1'
    this.rate_control_preset = config?.rate_control_preset || 'vbr_hq'
    this.sc_threshold = config?.sc_threshold || 0
    this.hls_flags =
      config?.hls_flags ||
      'append_list+independent_segments+program_date_time+second_level_segment_index'
    this.hls_list_size = config?.hls_list_size || 0
    this.strftime = config?.strftime || 1
    this.hls_time = config?.hls_time || 2
    this.hls_playlist_type = config?.hls_playlist_type || 'event'
    this.hls_segment_type = config?.hls_segment_type || 'mpegts'
    // this.method = config?.method || 'PUT'
    this.master_playlist_name = config?.master_playlist_name || 'playlist.m3u8'
    this.ffmpeg_flags = config?.ffmpeg_flags || ['-y']
  }

  args(mediaroot: string) {
    const segment_filename = `${mediaroot}${this.streamPath}/${this.scale.h}p_%Y%m%d-%%04d.ts`
    const outpath = `${mediaroot}${this.streamPath}/${this.scale.h}p.m3u8`
    const remaining_params = [
      // vsync:
      '-vsync',
      this.vsync,
      // hardware_acceleration
      '-hwaccel',
      this.hwaccel,
      // hardware_acceleration_output_format
      '-hwaccel_output_format',
      this.hwaccel_output_format, // keeps decoded frames in GPU memory
      // input
      '-i',
      this.source, // "E:\\Vids\\Vlogs\\october\\18th\\GOPR9685.MP4",
      // '-resize', `${this.scale.w}x${this.scale.h}`,
      '-c:a',
      this.audio_codec,
      '-c:v',
      this.vc,
      '-preset',
      this.video_codec_preset,
      '-tune',
      this.tune,
      '-profile:v',
      this.video_profile,
      '-b:v',
      `${this.vb}k`,
      // 'tag:v', 'hvc1',
      '-bufsize',
      `${this.vb}k`,
      '-maxrate',
      `10M`,
      '-qmin',
      this.qmin,
      '-g',
      this.key_frames_interval,
      // '-bf', this.bf,
      // '-temporal-aq', this.temporalAQ,
      // '-rc-lookahead', this.rcLookahead,
      // '-rc', this.rate_control_preset,
      // '-i_qfactor', this.iQfactor,
      // '-b_qfactor', this.bQfactor,
      // OUTPUT
      '-f',
      this.filetype,
      '-hls_flags',
      this.hls_flags,
      '-hls_list_size',
      this.hls_list_size,
      '-hls_time',
      this.hls_time,
      '-strftime',
      this.strftime,
      '-hls_playlist_type',
      this.hls_playlist_type,
      '-hls_segment_type',
      this.hls_segment_type,
      '-hls_segment_filename',
      segment_filename,
      // '-method', this.method,
      // '-master_pl_name', 'playlist.m3u8',
      outpath,
    ]
    Array.prototype.push.apply(this.ffmpeg_flags, remaining_params)
    return this.ffmpeg_flags
  }

  argString(mediaroot: string) {
    return this.args(mediaroot).join(' ')
  }
}

export class WStoRTMPcConfig extends ffmpegConfigInterface {
  constructor(streamPath: string, config?: ffmpegConfigInterface) {
    super()
    this.streamPath = streamPath
    this.source = '-'

    this.scale = config?.scale || { w: 1280, h: 720 }
    this.filetype = config?.filetype || 'hls'
    this.hwaccel = config?.hwaccel || 'cuda'
    this.hwaccel_output_format = config?.hwaccel_output_format || 'cuda'
    this.audio_codec = config?.audio_codec || 'copy'
    this.max_bitrate_ratio = config?.max_bitrate_ratio || 1.07
    this.key_frames_interval = config?.key_frames_interval || 48
    this.vsync = config?.vsync || 0
    this.qmin = config?.qmin || 0
    this.temporalAQ = config?.temporalAQ || 1
    this.rcLookahead = config?.rcLookahead || 20
    this.vb = config?.vb || 5000
    this.bf = config?.bf || 2
    this.vc = config?.vc || 'hevc_nvenc'
    this.iQfactor = config?.iQfactor || 0.75
    this.bQfactor = config?.bQfactor || 1.1
    this.video_profile = config?.video_profile || 'main'
    this.tune = config?.tune || 'hq'
    this.video_codec_preset = config?.video_codec_preset || 'llhq'
    this.rate_control_preset = config?.rate_control_preset || 'vbr_hq'
    this.sc_threshold = config?.sc_threshold || 0
    this.hls_flags =
      config?.hls_flags ||
      'append_list+independent_segments+program_date_time+second_level_segment_index'
    this.hls_list_size = config?.hls_list_size || 0
    this.strftime = config?.strftime || 1
    this.hls_time = config?.hls_time || 2
    this.hls_playlist_type = config?.hls_playlist_type || 'vod'
    this.hls_segment_type = config?.hls_segment_type || 'mpegts'
    // this.method = config?.method || 'PUT'
    this.master_playlist_name = config?.master_playlist_name || 'playlist.m3u8'
    this.ffmpeg_flags = config?.ffmpeg_flags || ['-y']
  }

  args() {
    // const segment_filename = `../../media${this.streamPath}/${this.scale.h}p_%Y%m%d-%%04d.ts`
    const outpath = `rtmp://127.0.0.1:1935${this.streamPath}`
    const remaining_params = [
      // vsync:
      // '-vsync', this.vsync,
      // hardware_acceleration
      // '-hwaccel', this.hwaccel,
      // hardware_acceleration_output_format
      // '-hwaccel_output_format', this.hwaccel_output_format, // keeps decoded frames in GPU memory
      // input
      '-i',
      this.source,
      // '-resize', `${this.scale.w}x${this.scale.h}`,
      '-c:a',
      'aac',
      '-strict',
      '1',
      '-ar',
      '44100',
      '-b:a',
      '64k',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-tune',
      'zerolatency',
      // '-profile:v', this.video_profile,
      // '-b:v', `${this.vb}k`,
      // '-bufsize', `${this.vb}k`,
      // '-maxrate', `10M`,
      // '-qmin', this.qmin,
      // '-g', this.key_frames_interval,
      // '-bf', this.bf,
      // '-temporal-aq', this.temporalAQ,
      // '-rc-lookahead', this.rcLookahead,
      // '-rc', this.rate_control_preset,
      // '-i_qfactor', this.iQfactor,
      // '-b_qfactor', this.bQfactor,
      // OUTPUT
      '-f',
      'flv',
      // '-hls_flags', this.hls_flags,
      // '-hls_list_size', this.hls_list_size,
      // '-hls_time', this.hls_time,
      // '-strftime', this.strftime,
      // '-hls_playlist_type', this.hls_playlist_type,
      // '-hls_segment_type', this.hls_segment_type,
      // '-hls_segment_filename', segment_filename,
      // // '-method', this.method,
      // '-master_pl_name', 'playlist.m3u8',
      outpath,
    ]
    Array.prototype.push.apply(this.ffmpeg_flags, remaining_params)
    return this.ffmpeg_flags
  }

  argString() {
    return this.args().join(' ')
  }
}
