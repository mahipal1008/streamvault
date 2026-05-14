import { spawn } from 'node:child_process'
import type { Readable } from 'node:stream'
import { parseFormats, parseAudioTracks, parseSubtitles } from './formats.js'

export interface ParsedMeta {
  title: string
  thumbnail?: string
  duration: number
  uploader: string
  viewCount?: number
  uploadDate?: string
  platform: string
  formats: ReturnType<typeof parseFormats>
  audioTracks: ReturnType<typeof parseAudioTracks>
  subtitles: ReturnType<typeof parseSubtitles>
  requiresProxy: boolean
}

function buildBaseArgs(proxyUrl?: string): string[] {
  const args = [
    '--no-playlist', '--no-warnings',
    // Use android + web clients to bypass YouTube bot detection
    '--extractor-args', 'youtube:player_client=android,web',
  ]
  if (proxyUrl) args.push('--proxy', proxyUrl)
  return args
}

function isProxyNeeded(stderr: string): boolean {
  return (
    stderr.includes('not available in your country') ||
    stderr.includes('geo') ||
    stderr.includes('blocked') ||
    stderr.includes('unavailable') ||
    stderr.includes('Sign in to confirm') ||
    stderr.includes('bot detection') ||
    stderr.includes('This content isn\'t available') ||
    stderr.includes('Private video')
  )
}

export async function getMetadata(url: string, proxyUrl?: string): Promise<ParsedMeta> {
  const args = [...buildBaseArgs(proxyUrl), '--dump-single-json']
  args.push(url)

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error('Metadata fetch timeout (45s)'))
    }, 45_000)

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        const err = Object.assign(new Error(stderr.slice(0, 400)), {
          requiresProxy: isProxyNeeded(stderr),
        })
        reject(err)
        return
      }
      try {
        const raw = JSON.parse(stdout)
        resolve({
          title: raw.title ?? 'Untitled',
          thumbnail: raw.thumbnail,
          duration: raw.duration ?? 0,
          uploader: raw.uploader ?? raw.channel ?? 'Unknown',
          viewCount: raw.view_count,
          uploadDate: raw.upload_date,
          platform: raw.extractor_key ?? raw.extractor ?? 'Unknown',
          formats: parseFormats(raw.formats ?? []),
          audioTracks: parseAudioTracks(raw.formats ?? []),
          subtitles: parseSubtitles(raw.subtitles ?? {}, raw.automatic_captions ?? {}),
          requiresProxy: false,
        })
      } catch (e) {
        reject(new Error(`Failed to parse yt-dlp output: ${e}`))
      }
    })
  })
}

export function buildArgs(opts: {
  url: string
  videoFormatId: string
  audioTrackIds: string[]
  subtitleLangs: string[]
  subtitleMode: string
  container: string
  outputPath: string
  proxyUrl?: string
}): string[] {
  const args: string[] = [...buildBaseArgs(opts.proxyUrl)]

  const isAudioOnly =
    opts.videoFormatId === 'bestaudio' || opts.container === 'mp3' || opts.container === 'flac' || opts.container === 'aac' || opts.container === 'm4a' || opts.container === 'ogg'

  if (isAudioOnly) {
    args.push('-x')
    const fmtMap: Record<string, string> = { mp3: 'mp3', flac: 'flac', aac: 'aac', m4a: 'm4a', ogg: 'vorbis', opus: 'opus' }
    args.push('--audio-format', fmtMap[opts.container] ?? 'mp3')
    args.push('--audio-quality', '0')
  } else {
    const audioId = opts.audioTrackIds[0]
    const fmtSpec = audioId ? `${opts.videoFormatId}+${audioId}` : `${opts.videoFormatId}+bestaudio/best`
    args.push('-f', fmtSpec)
    const mergeExt = opts.container === 'webm' ? 'webm' : opts.container === 'mkv' ? 'mkv' : 'mp4'
    args.push('--merge-output-format', mergeExt)
  }

  if (opts.subtitleLangs.length > 0 && opts.subtitleMode !== 'sidecar') {
    args.push('--write-subs', '--sub-langs', opts.subtitleLangs.join(','))
    if (opts.subtitleMode === 'soft') args.push('--embed-subs')
  } else if (opts.subtitleLangs.length > 0 && opts.subtitleMode === 'sidecar') {
    args.push('--write-subs', '--sub-langs', opts.subtitleLangs.join(','))
  }

  args.push('--ffmpeg-location', 'ffmpeg')
  args.push('--newline')
  args.push('-o', opts.outputPath)
  args.push(opts.url)

  return args
}

export function spawnDirect(url: string, formatId: string, proxyUrl?: string): Readable {
  const args = [...buildBaseArgs(proxyUrl), '-f', formatId, '-o', '-', url]
  return spawn('yt-dlp', args).stdout
}
