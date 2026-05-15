import type { AudioTrack, SubtitleTrack, VideoFormat } from 'streamvault-shared'

interface RawFormat {
  format_id: string
  ext: string
  acodec?: string
  vcodec?: string
  width?: number
  height?: number
  fps?: number
  filesize?: number
  filesize_approx?: number
  tbr?: number
  abr?: number
  vbr?: number
  audio_channels?: number
  dynamic_range?: string
  language?: string
  format_note?: string
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German',
  ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic', pt: 'Portuguese',
  ru: 'Russian', it: 'Italian', nl: 'Dutch', pl: 'Polish', tr: 'Turkish',
  sv: 'Swedish', da: 'Danish', fi: 'Finnish', no: 'Norwegian', he: 'Hebrew',
  th: 'Thai', id: 'Indonesian', ms: 'Malay', vi: 'Vietnamese', uk: 'Ukrainian',
  bn: 'Bengali', ur: 'Urdu', ta: 'Tamil', te: 'Telugu', mr: 'Marathi',
  gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ro: 'Romanian',
  hu: 'Hungarian', cs: 'Czech', sk: 'Slovak', bg: 'Bulgarian', hr: 'Croatian',
  sr: 'Serbian', ca: 'Catalan', el: 'Greek', lt: 'Lithuanian', lv: 'Latvian',
}

function heightToLabel(h: number, dr?: string): string {
  const hdr = dr && dr !== 'SDR' ? ' HDR' : ''
  if (h >= 4320) return `8K${hdr}`
  if (h >= 2160) return `4K${hdr}`
  if (h >= 1080) return `1080p${hdr}`
  if (h >= 720) return '720p'
  if (h >= 480) return '480p'
  if (h >= 360) return '360p'
  if (h >= 240) return '240p'
  return '144p'
}

export function parseFormats(rawFormats: unknown[], durationSec = 0): VideoFormat[] {
  const fmts = rawFormats as RawFormat[]
  const seen = new Set<string>()
  const result: VideoFormat[] = []

  // Compute filesize fallback from (bitrate_kbps * 1000 / 8) * duration_s, when filesize is missing.
  // Bitrate keys vary: tbr (total), vbr (video), abr (audio). Use whichever is present.
  const estimateBytes = (bitrateKbps?: number): number | undefined => {
    if (!bitrateKbps || bitrateKbps <= 0 || durationSec <= 0) return undefined
    return Math.round((bitrateKbps * 1000 / 8) * durationSec)
  }

  const videoFmts = fmts
    .filter((f) => f.vcodec && f.vcodec !== 'none' && f.height && f.height > 0)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))

  for (const f of videoFmts) {
    const label = heightToLabel(f.height!, f.dynamic_range)
    if (seen.has(label)) continue
    seen.add(label)
    // For merged video+audio downloads, combine video and best audio bitrate when we lack filesize
    const combinedBr = (f.vbr ?? f.tbr ?? 0) + (f.acodec && f.acodec !== 'none' ? (f.abr ?? 0) : 128)
    result.push({
      id: f.format_id,
      qualityLabel: label as VideoFormat['qualityLabel'],
      height: f.height!,
      fps: Math.round(f.fps ?? 30),
      vcodec: f.vcodec ?? '',
      acodec: f.acodec ?? '',
      ext: f.ext,
      filesize: f.filesize ?? f.filesize_approx ?? estimateBytes(combinedBr || f.tbr),
      hdr: !!(f.dynamic_range && f.dynamic_range !== 'SDR'),
      hasAudio: !!(f.acodec && f.acodec !== 'none'),
      isAudioOnly: false,
      bitrate: f.vbr ?? f.tbr,
    })
  }

  const audioOnly = fmts.find(
    (f) => (f.vcodec === 'none' || !f.vcodec) && f.acodec && f.acodec !== 'none' && !f.language
  )
  if (audioOnly) {
    result.push({
      id: audioOnly.format_id,
      qualityLabel: 'Audio Only',
      height: 0,
      fps: 0,
      vcodec: 'none',
      acodec: audioOnly.acodec ?? 'aac',
      ext: audioOnly.ext,
      filesize: audioOnly.filesize ?? audioOnly.filesize_approx ?? estimateBytes(audioOnly.abr ?? audioOnly.tbr),
      hdr: false,
      hasAudio: true,
      isAudioOnly: true,
      bitrate: audioOnly.abr ?? audioOnly.tbr,
    })
  }

  return result
}

export function parseAudioTracks(rawFormats: unknown[]): AudioTrack[] {
  const fmts = rawFormats as RawFormat[]
  const audioFmts = fmts.filter(
    (f) =>
      (f.vcodec === 'none' || !f.vcodec) &&
      f.acodec &&
      f.acodec !== 'none' &&
      f.language &&
      f.language !== 'und'
  )
  if (audioFmts.length === 0) return []

  const byLang = new Map<string, RawFormat>()
  for (const f of audioFmts) {
    const lang = f.language ?? 'en'
    const prev = byLang.get(lang)
    if (!prev || (f.abr ?? 0) > (prev.abr ?? 0)) byLang.set(lang, f)
  }

  return Array.from(byLang.entries()).map(([lang, f], i) => ({
    id: f.format_id,
    language: LANG_NAMES[lang] ?? lang,
    languageCode: lang,
    codec: f.acodec ?? 'aac',
    bitrate: f.abr ?? 128,
    channels: f.audio_channels ?? 2,
    isOriginal: i === 0,
  }))
}

export function parseSubtitles(
  subs: Record<string, unknown[]>,
  auto: Record<string, unknown[]>
): SubtitleTrack[] {
  const result: SubtitleTrack[] = []

  for (const [lang, tracks] of Object.entries(subs)) {
    if (lang === 'live_chat') continue
    result.push({
      language: LANG_NAMES[lang] ?? lang,
      languageCode: lang,
      isAuto: false,
      formats: (tracks as { ext?: string }[]).map((t) => t.ext ?? 'vtt').slice(0, 3),
    })
  }

  for (const [lang, tracks] of Object.entries(auto)) {
    if (lang === 'live_chat') continue
    if (result.some((s) => s.languageCode === lang)) continue
    result.push({
      language: LANG_NAMES[lang] ?? lang,
      languageCode: lang,
      isAuto: true,
      formats: (tracks as { ext?: string }[]).map((t) => t.ext ?? 'vtt').slice(0, 2),
    })
  }

  return result
}
