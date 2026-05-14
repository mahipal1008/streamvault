export type QualityLabel =
  | '8K HDR'
  | '8K'
  | '4K HDR'
  | '4K'
  | '1080p HDR'
  | '1080p'
  | '720p'
  | '480p'
  | '360p'
  | '240p'
  | '144p'
  | 'Audio Only'

export type Container = 'mkv' | 'mp4' | 'webm' | 'mp3' | 'aac' | 'flac' | 'm4a' | 'ogg'

export type SubtitleMode = 'soft' | 'hard' | 'sidecar'

export type LaneType = 'direct' | 'proxy'

export type JobStatus = 'pending' | 'running' | 'done' | 'error' | 'aborted'

export interface VideoFormat {
  id: string
  qualityLabel: QualityLabel
  height: number
  fps: number
  vcodec: string
  acodec: string
  ext: string
  filesize?: number
  hdr: boolean
  hasAudio: boolean
  isAudioOnly: boolean
  bitrate?: number
}

export interface AudioTrack {
  id: string
  language: string
  languageCode: string
  codec: string
  bitrate: number
  channels: number
  isOriginal: boolean
}

export interface SubtitleTrack {
  language: string
  languageCode: string
  isAuto: boolean
  formats: string[]
}

export interface VideoMetadata {
  url: string
  platform: string
  title: string
  thumbnail?: string
  duration: number
  uploader: string
  viewCount?: number
  uploadDate?: string
  formats: VideoFormat[]
  audioTracks: AudioTrack[]
  subtitles: SubtitleTrack[]
  requiresProxy: boolean
  lane: LaneType
}

export interface DownloadRequest {
  url: string
  videoFormatId: string
  audioTrackIds: string[]
  subtitleLangs: string[]
  subtitleMode: SubtitleMode
  container: Container
  preferredLane?: LaneType
}

export interface DownloadResponse {
  jobId: string
  keyBase64: string
  filename: string
  estimatedSize?: number
  lane: LaneType
}

export interface ProgressEvent {
  type: 'progress' | 'done' | 'error'
  jobId: string
  progress: number
  received: number
  total: number
  speed: number
  lane: LaneType
  status: JobStatus
  error?: string
}

export interface SiteEntry {
  name: string
  slug: string
  category: string
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
