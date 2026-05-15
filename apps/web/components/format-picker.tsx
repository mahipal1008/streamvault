'use client'

import { useState, useMemo } from 'react'
import { Download, ChevronDown, ChevronUp, Mic, Subtitles, Music, FileText } from 'lucide-react'
import type { VideoMetadata, Container, SubtitleMode } from 'streamvault-shared'
import { formatBytes } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const CONTAINERS = ['mp4', 'mkv', 'webm', 'mp3', 'aac', 'flac', 'm4a'] as const

interface Props {
  meta: VideoMetadata
  onDownload: (params: {
    videoFormatId: string
    audioTrackIds: string[]
    subtitleLangs: string[]
    subtitleMode: SubtitleMode
    container: Container
    subtitleFormat?: 'srt' | 'vtt'
  }) => void
  loading: boolean
}

function QualityBadge({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const isHdr = label.includes('HDR') || label.includes('8K') || label.includes('4K')
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex h-10 min-w-[64px] items-center justify-center rounded-xl px-3 text-sm font-medium transition-all',
        selected
          ? 'bg-accent text-black ring-2 ring-accent ring-offset-1 ring-offset-surface'
          : 'bg-surface-2 text-muted ring-1 ring-white/5 hover:ring-white/15 hover:text-primary'
      )}
    >
      {isHdr && !selected && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning" />
      )}
      {label}
    </button>
  )
}

export function FormatPicker({ meta, onDownload, loading }: Props) {
  const formats = meta.formats ?? []
  const audioTracks = meta.audioTracks ?? []
  const subtitleTracks = meta.subtitles ?? []

  const [selectedFormat, setSelectedFormat] = useState(formats[0]?.id ?? '')
  const [selectedAudio, setSelectedAudio] = useState<string[]>(audioTracks[0] ? [audioTracks[0].id] : [])
  const [selectedSubs, setSelectedSubs] = useState<string[]>([])
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('soft')
  const [container, setContainer] = useState<Container>('mp4')
  const [advanced, setAdvanced] = useState(false)

  const currentFormat = useMemo(() => formats.find((f) => f.id === selectedFormat), [formats, selectedFormat])

  const estimatedSize = currentFormat?.filesize != null
    ? formatBytes(currentFormat.filesize)
    : 'Size unknown'

  const toggleAudio = (id: string) => {
    setSelectedAudio((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((a) => a !== id) : prev) : [...prev, id]
    )
  }

  const toggleSub = (lang: string) => {
    setSelectedSubs((prev) => prev.includes(lang) ? prev.filter((s) => s !== lang) : [...prev, lang])
  }

  const downloadSubOnly = (lang: string, fmt: 'srt' | 'vtt') => {
    onDownload({
      videoFormatId: 'subs-only',
      audioTrackIds: [],
      subtitleLangs: [lang],
      subtitleMode: 'sidecar',
      container: 'mp4',
      subtitleFormat: fmt,
    })
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-5 space-y-5 animate-fade_in">
      {/* Video Quality */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
          Video Quality
        </p>
        <div className="flex flex-wrap gap-2">
          {formats.length === 0 && <p className="text-sm text-muted">No video formats found</p>}
          {formats.map((f) => (
            <QualityBadge
              key={f.id}
              label={f.qualityLabel}
              selected={selectedFormat === f.id}
              onClick={() => setSelectedFormat(f.id)}
            />
          ))}
        </div>
      </div>

      {/* Subtitles — always visible when available */}
      {subtitleTracks.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-surface-2/40 p-4 space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
            <Subtitles className="h-3 w-3" /> Subtitles
          </p>

          <div className="flex flex-wrap gap-2">
            {subtitleTracks.map((s) => (
              <button
                key={s.languageCode}
                onClick={() => toggleSub(s.languageCode)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs transition-all',
                  selectedSubs.includes(s.languageCode)
                    ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                    : 'bg-surface-2 text-muted ring-1 ring-white/5 hover:ring-white/15'
                )}
              >
                {s.language}
              </button>
            ))}
          </div>

          {selectedSubs.length > 0 && (
            <>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-faint pt-1">Embed mode:</span>
                {(['soft', 'hard', 'sidecar'] as SubtitleMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSubtitleMode(m)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs capitalize transition-all',
                      subtitleMode === m
                        ? 'bg-surface-2 text-primary ring-1 ring-white/15'
                        : 'text-faint hover:text-muted'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Per-language subtitle file download buttons */}
              <div className="space-y-1.5">
                <p className="text-xs text-faint">Download subtitle file only:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubs.map((lang) => {
                    const track = subtitleTracks.find(t => t.languageCode === lang)
                    const label = track?.language ?? lang
                    return (
                      <div key={lang} className="flex gap-1">
                        <button
                          disabled={loading}
                          onClick={() => downloadSubOnly(lang, 'srt')}
                          className="flex items-center gap-1 rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-1.5 text-xs text-accent transition hover:bg-accent/10 disabled:opacity-40"
                        >
                          <FileText className="h-3 w-3" />
                          {label} .srt
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => downloadSubOnly(lang, 'vtt')}
                          className="flex items-center gap-1 rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1.5 text-xs text-muted transition hover:text-primary disabled:opacity-40"
                        >
                          <FileText className="h-3 w-3" />
                          .vtt
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Advanced toggle */}
      <button
        onClick={() => setAdvanced(!advanced)}
        className="flex items-center gap-1.5 text-xs text-muted transition hover:text-primary"
      >
        {advanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Advanced options
      </button>

      {advanced && (
        <div className="space-y-4 border-t border-white/5 pt-4 animate-fade_in">
          {audioTracks.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
                <Mic className="h-3 w-3" /> Audio Tracks
              </p>
              <div className="flex flex-wrap gap-2">
                {audioTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleAudio(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all',
                      selectedAudio.includes(t.id)
                        ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                        : 'bg-surface-2 text-muted ring-1 ring-white/5 hover:ring-white/15'
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: selectedAudio.includes(t.id) ? 'var(--accent)' : 'var(--faint)' }} />
                    {t.language ?? t.id}
                    {t.isOriginal && <span className="text-faint">(default)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
              <Music className="h-3 w-3" /> Container
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTAINERS.map((c) => (
                <button
                  key={c}
                  onClick={() => setContainer(c)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 font-mono text-xs uppercase transition-all',
                    container === c
                      ? 'bg-surface-2 text-primary ring-1 ring-white/20'
                      : 'text-faint hover:text-muted'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div>
          <p className="text-xs text-muted">Estimated size</p>
          <p className="text-sm font-semibold text-primary">{estimatedSize}</p>
        </div>
        <button
          disabled={!selectedFormat || loading}
          onClick={() =>
            onDownload({
              videoFormatId: selectedFormat,
              audioTrackIds: selectedAudio,
              subtitleLangs: selectedSubs,
              subtitleMode,
              container,
            })
          }
          className={cn(
            'flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200',
            selectedFormat && !loading
              ? 'bg-accent text-black hover:scale-[1.02] glow'
              : 'cursor-not-allowed bg-surface-2 text-faint ring-1 ring-white/5'
          )}
        >
          <Download className="h-4 w-4" />
          {loading ? 'Downloading…' : 'Download'}
        </button>
      </div>
    </div>
  )
}
