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
  const args = ['--no-playlist', '--no-warnings']
  if (proxyUrl) args.push('--proxy', proxyUrl)
  return args
}

function buildIosArgs(proxyUrl?: string): string[] {
  const args = [
    '--no-playlist', '--no-warnings',
    // Fallback: ios+android clients bypass bot detection but return limited formats
    '--extractor-args', 'youtube:player_client=ios,android',
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

function isBotDetected(stderr: string): boolean {
  return (
    stderr.includes('Sign in to confirm') ||
    stderr.includes('bot') ||
    stderr.includes('age-restricted') ||
    stderr.includes('This video is not available')
  )
}

async function runYtdlp(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('yt-dlp', args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill()
      resolve({ stdout, stderr: stderr + '\nTIMEOUT', code: 1 })
    }, 45_000)

    proc.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, code: code ?? 1 })
    })
  })
}

export async function getMetadata(url: string, proxyUrl?: string): Promise<ParsedMeta> {
  // Phase 1: try with default clients (full quality, all formats)
  const args1 = [...buildBaseArgs(proxyUrl), '--dump-single-json', url]
  const result1 = await runYtdlp(args1)

  if (result1.code === 0) {
    return parseYtdlpOutput(result1.stdout)
  }

  const phase1BotDetected = isBotDetected(result1.stderr)

  // Phase 2a: if bot-detected and no proxy, retry with ios/android (limited quality)
  if (phase1BotDetected && !proxyUrl) {
    const args2 = [...buildIosArgs(), '--dump-single-json', url]
    const result2 = await runYtdlp(args2)
    if (result2.code === 0) return parseYtdlpOutput(result2.stdout)
    // ios fallback also failed — surface original error with requiresProxy hint
    const err = Object.assign(new Error(result2.stderr.slice(0, 400)), { requiresProxy: true })
    throw err
  }

  const err = Object.assign(new Error(result1.stderr.slice(0, 400)), {
    requiresProxy: isProxyNeeded(result1.stderr),
  })
  throw err
}

function parseYtdlpOutput(stdout: string): ParsedMeta {
  try {
    const raw = JSON.parse(stdout)
    return {
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
    }
  } catch (e) {
    throw new Error(`Failed to parse yt-dlp output: ${e}`)
  }
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
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
  useIosFallback?: boolean
  subtitleFormat?: string
}): string[] {
  const baseArgs = opts.useIosFallback && isYouTubeUrl(opts.url) && !opts.proxyUrl
    ? buildIosArgs(opts.proxyUrl)
    : buildBaseArgs(opts.proxyUrl)

  // Subtitle-only mode: download just the .srt / .vtt file, skip video entirely
  if (opts.videoFormatId === 'subs-only') {
    const args = [...baseArgs]
    args.push('--skip-download')
    args.push('--write-subs', '--write-auto-subs')
    const langs = opts.subtitleLangs.length > 0 ? opts.subtitleLangs.join(',') : 'en'
    args.push('--sub-langs', langs)
    args.push('--sub-format', opts.subtitleFormat ?? 'srt/vtt/best')
    args.push('--no-overwrites')
    args.push('--newline')
    args.push('-o', opts.outputPath)
    args.push(opts.url)
    return args
  }

  const args: string[] = [...baseArgs]

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

  args.push('--newline')
  args.push('-o', opts.outputPath)
  args.push(opts.url)

  return args
}

export function spawnDirect(url: string, formatId: string, proxyUrl?: string): Readable {
  const args = [...buildBaseArgs(proxyUrl), '-f', formatId, '-o', '-', url]
  return spawn('yt-dlp', args).stdout
}
