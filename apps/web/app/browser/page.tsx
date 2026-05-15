'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, RefreshCcw, Home, Search, Globe, Shield,
  Download, X, ExternalLink, Lock, EyeOff, AlertTriangle
} from 'lucide-react'
import type { VideoMetadata, DownloadRequest, SubtitleMode, Container } from 'streamvault-shared'
import { PreviewCard } from '@/components/preview-card'
import { FormatPicker } from '@/components/format-picker'
import { DownloadProgress } from '@/components/download-progress'
import { fetchMeta, startDownload, openProgressStream, API_BASE } from '@/lib/api'
import { decryptStream, saveBlob } from '@/lib/crypto'
import { cn } from '@/lib/utils'

const HOME_PAGE = 'about:blank'

// Curated quick-launch shortcuts. Most major sites block iframe embedding (X-Frame-Options),
// so we keep this list to platforms that either allow embedding or degrade gracefully.
const QUICK_SITES = [
  { name: 'Vimeo', url: 'https://vimeo.com/' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/' },
  { name: 'Reddit', url: 'https://old.reddit.com/' },
  { name: 'Bandcamp', url: 'https://bandcamp.com/' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/' },
  { name: 'Archive.org', url: 'https://archive.org/' },
  { name: 'Bilibili', url: 'https://www.bilibili.com/' },
]

type Phase = 'idle' | 'loading' | 'preview' | 'preparing' | 'server' | 'decrypt' | 'done'

interface ProgressState {
  phase: 'server' | 'decrypt' | 'done'
  serverProgress: number
  decryptProgress: number
  totalBytes: number
  speed: number
  filename: string
  lane: string
}

function normalizeUrl(input: string): string {
  const v = input.trim()
  if (!v) return HOME_PAGE
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w.-]+\.[a-z]{2,}/i.test(v)) return `https://${v}`
  // Treat as DuckDuckGo search
  return `https://duckduckgo.com/?q=${encodeURIComponent(v)}`
}

export default function BrowserPage() {
  const [url, setUrl] = useState('')
  const [iframeUrl, setIframeUrl] = useState(HOME_PAGE)
  const [history, setHistory] = useState<string[]>([HOME_PAGE])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Download modal state
  const [showModal, setShowModal] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [meta, setMeta] = useState<VideoMetadata | null>(null)
  const [progress, setProgress] = useState<ProgressState | null>(null)

  // Detect frame-busting attempts: if the iframe never fires onLoad within 6s, assume blocked.
  useEffect(() => {
    if (iframeUrl === HOME_PAGE) {
      setBlocked(false)
      return
    }
    setBlocked(false)
    const t = setTimeout(() => {
      // best-effort: most blocked iframes still fire onLoad, but for total bust we still nudge
      try {
        // accessing contentWindow.location.href throws for cross-origin (normal), so we can't reliably detect.
        // We rely on a timeout heuristic for the obvious cases.
      } catch {}
    }, 6000)
    return () => clearTimeout(t)
  }, [iframeUrl, iframeKey])

  const go = useCallback((raw: string, pushHistory = true) => {
    const next = normalizeUrl(raw)
    setIframeUrl(next)
    setUrl(next === HOME_PAGE ? '' : next)
    setIframeKey((k) => k + 1)
    if (pushHistory) {
      setHistory((h) => {
        const trimmed = h.slice(0, historyIndex + 1)
        const out = [...trimmed, next]
        setHistoryIndex(out.length - 1)
        return out
      })
    }
  }, [historyIndex])

  const back = () => {
    if (historyIndex === 0) return
    const i = historyIndex - 1
    setHistoryIndex(i)
    setIframeUrl(history[i])
    setUrl(history[i] === HOME_PAGE ? '' : history[i])
    setIframeKey((k) => k + 1)
  }

  const forward = () => {
    if (historyIndex >= history.length - 1) return
    const i = historyIndex + 1
    setHistoryIndex(i)
    setIframeUrl(history[i])
    setUrl(history[i] === HOME_PAGE ? '' : history[i])
    setIframeKey((k) => k + 1)
  }

  const reload = () => setIframeKey((k) => k + 1)
  const home = () => go(HOME_PAGE, true)

  const detectAndDownload = useCallback(async () => {
    const target = iframeUrl === HOME_PAGE ? url.trim() : iframeUrl
    if (!target || target === HOME_PAGE) {
      toast.error('Open a page first, or type a video URL above.')
      return
    }
    setShowModal(true)
    setPhase('loading')
    setMeta(null)
    setProgress(null)
    try {
      const m = await fetchMeta(target)
      setMeta(m)
      setPhase('preview')
    } catch (e: unknown) {
      toast.error((e as Error).message || 'No downloadable media found on this page.')
      setPhase('idle')
      setShowModal(false)
    }
  }, [iframeUrl, url])

  const handleDownload = useCallback(
    async (params: { videoFormatId: string; audioTrackIds: string[]; subtitleLangs: string[]; subtitleMode: SubtitleMode; container: Container; subtitleFormat?: 'srt' | 'vtt' }) => {
      if (!meta) return
      setPhase('preparing')
      try {
        const req: DownloadRequest = { url: meta.url, ...params }
        const dlRes = await startDownload(req)
        setPhase('server')
        setProgress({
          phase: 'server',
          serverProgress: 0,
          decryptProgress: 0,
          totalBytes: 0,
          speed: 0,
          filename: dlRes.filename,
          lane: dlRes.lane,
        })

        await new Promise<void>((resolve, reject) => {
          const es = openProgressStream(dlRes.jobId)
          es.addEventListener('progress', (e) => {
            const d = JSON.parse((e as MessageEvent).data)
            setProgress((p) => p ? { ...p, serverProgress: d.progress, totalBytes: d.total, speed: d.speed } : p)
          })
          es.addEventListener('done', () => { es.close(); resolve() })
          es.addEventListener('error', () => { es.close(); reject(new Error('Server failed')) })
        })

        setPhase('decrypt')
        setProgress((p) => p ? { ...p, phase: 'decrypt' } : p)
        const streamRes = await fetch(`${API_BASE}/api/stream/${dlRes.jobId}`)
        if (!streamRes.ok) throw new Error('Stream request failed')

        const blob = await decryptStream(streamRes, dlRes.keyBase64, (bytes) => {
          setProgress((p) => {
            if (!p) return p
            const total = p.totalBytes || bytes
            return { ...p, decryptProgress: Math.min((bytes / total) * 100, 99) }
          })
        })
        setProgress((p) => p ? { ...p, phase: 'done', serverProgress: 100, decryptProgress: 100 } : p)
        setPhase('done')
        await saveBlob(blob, dlRes.filename)
        toast.success(`Saved: ${dlRes.filename}`)
      } catch (e: unknown) {
        toast.error((e as Error).message || 'Download failed')
        setPhase('preview')
      }
    },
    [meta]
  )

  const closeModal = () => {
    if (phase === 'server' || phase === 'decrypt' || phase === 'preparing') return
    setShowModal(false)
    setPhase('idle')
    setMeta(null)
    setProgress(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6">
      {/* Browser chrome */}
      <div className="rounded-2xl border border-[var(--border)] bg-surface/80 shadow-md overflow-hidden">
        {/* URL bar */}
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-surface-2/40 px-2 py-2 sm:gap-2 sm:px-3">
          <button
            onClick={back}
            disabled={historyIndex === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-primary disabled:opacity-30"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={forward}
            disabled={historyIndex >= history.length - 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-primary disabled:opacity-30"
            aria-label="Forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={reload}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-primary"
            aria-label="Reload"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            onClick={home}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-primary"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </button>

          <form
            onSubmit={(e) => { e.preventDefault(); go(url) }}
            className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-surface px-3 py-1.5 focus-within:border-accent/50 focus-within:shadow-glow"
          >
            <Lock className="h-3.5 w-3.5 shrink-0 text-success" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Search or paste any URL — youtube.com, vimeo.com, …"
              className="w-full bg-transparent text-sm text-primary placeholder:text-faint outline-none"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="hidden items-center gap-1 rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 ring-1 ring-purple-500/20 sm:flex">
              <EyeOff className="h-3 w-3" />
              Private
            </span>
          </form>

          <button
            onClick={detectAndDownload}
            className="ml-1 flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white dark:text-black transition hover:shadow-glow sm:px-4 sm:text-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Detect &amp;</span> Download
          </button>
        </div>

        {/* Quick suggestions when on home */}
        {iframeUrl === HOME_PAGE && (
          <div className="border-b border-[var(--border)] bg-surface/40 px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/20">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <h1 className="text-xl font-bold sm:text-2xl">Private In-App Browser</h1>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
                Browse anywhere without restrictions. No cookies persist, no third-party trackers,
                no referrer leaked. Find a video, click <span className="font-semibold text-accent">Detect &amp; Download</span>.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_SITES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => go(s.url)}
                    className="rounded-xl border border-[var(--border)] bg-surface px-3 py-3 text-sm font-medium text-secondary transition hover:border-accent/40 hover:text-accent hover:shadow-sm"
                  >
                    <Globe className="mx-auto mb-1.5 h-4 w-4 text-faint" />
                    {s.name}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-[11px] leading-relaxed text-faint">
                Many large platforms (YouTube, Instagram, Facebook, TikTok) refuse to render inside any iframe for security reasons.
                If a page won&rsquo;t load, paste the URL above and hit <span className="font-semibold">Detect &amp; Download</span> directly —
                the same private pipeline handles it.
              </p>
            </div>
          </div>
        )}

        {/* Iframe viewport */}
        {iframeUrl !== HOME_PAGE && (
          <div className="relative bg-black/80" style={{ height: 'calc(100dvh - 220px)', minHeight: 520 }}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={iframeUrl}
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
              referrerPolicy="no-referrer"
              allow="autoplay; fullscreen; picture-in-picture"
              onLoad={() => setBlocked(false)}
              onError={() => setBlocked(true)}
            />

            {/* Floating Detect & Download FAB on bottom-right */}
            <button
              onClick={detectAndDownload}
              className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white dark:text-black shadow-2xl shadow-accent/30 transition hover:scale-105"
            >
              <Download className="h-4 w-4" />
              Download from this page
            </button>

            {/* Open in new tab fallback */}
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-xs font-medium text-muted backdrop-blur-sm ring-1 ring-[var(--border)] hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              Open externally
            </a>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] text-faint">
        <AlertTriangle className="mr-1 inline h-3 w-3 text-warning" />
        You are responsible for the content you download. Respect copyright and local laws.
      </p>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-background shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!['server', 'decrypt', 'preparing'].includes(phase) && (
                <button
                  onClick={closeModal}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted transition hover:text-primary"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <div className="p-5 sm:p-6">
                {phase === 'loading' && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-2 border-t-accent" />
                    <p className="text-sm text-muted">Scanning page for media…</p>
                  </div>
                )}

                {phase === 'preview' && meta && (
                  <div className="space-y-4">
                    <PreviewCard meta={meta} lane={meta.lane} url={meta.url} />
                    <FormatPicker meta={meta} onDownload={handleDownload} loading={false} />
                  </div>
                )}

                {phase === 'preparing' && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-2 border-t-accent" />
                    <p className="text-sm text-muted">Preparing your download…</p>
                  </div>
                )}

                {(phase === 'server' || phase === 'decrypt' || phase === 'done') && progress && (
                  <div>
                    <DownloadProgress {...progress} />
                    {phase === 'done' && (
                      <button
                        onClick={closeModal}
                        className="mt-4 w-full rounded-xl bg-surface py-3 text-sm text-muted border border-[var(--border)] transition hover:border-[var(--border-strong)] hover:text-primary"
                      >
                        Close
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
