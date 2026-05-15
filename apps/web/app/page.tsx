'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import type { VideoMetadata, DownloadRequest, SubtitleMode, Container } from 'streamvault-shared'
import { UrlInput } from '@/components/url-input'
import { PreviewCard } from '@/components/preview-card'
import { FormatPicker } from '@/components/format-picker'
import { DownloadProgress } from '@/components/download-progress'
import { fetchMeta, startDownload, openProgressStream, API_BASE } from '@/lib/api'
import { decryptStream, saveBlob } from '@/lib/crypto'
import {
  Shield, Zap, Lock, Globe, ArrowRight, CheckCircle2, XCircle,
  Download, Monitor, Smartphone, Headphones, FileVideo, Subtitles,
  Star, Users, BarChart3, Play, ChevronRight, EyeOff, Languages,
  Sparkles, Gauge, Infinity as InfinityIcon, MousePointerClick,
  Film, Music2, Mic2, Image as ImageIcon, FileText
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

const FEATS = [
  { icon: Globe, title: '1 000+ Platforms', desc: 'YouTube, TikTok, Instagram, X, Reddit, Twitch and hundreds more.', color: 'text-blue-500' },
  { icon: Zap, title: 'Up to 8K HDR', desc: 'Ultra-HD video with Dolby Vision, HDR10, and multi-language audio tracks.', color: 'text-amber-500' },
  { icon: Lock, title: 'AES-256-GCM', desc: 'Military-grade encryption. Your decryption key never leaves your browser.', color: 'text-emerald-500' },
  { icon: Shield, title: 'Zero Logs', desc: 'No accounts, no cookies, no analytics, no tracking. Period.', color: 'text-purple-500' },
]

const STEPS = [
  { step: '01', title: 'Paste URL', desc: 'Copy any media URL and paste it into the input field above.', icon: Globe },
  { step: '02', title: 'Choose Quality', desc: 'Select your preferred resolution, audio tracks, and subtitles.', icon: Monitor },
  { step: '03', title: 'Download Securely', desc: 'File is encrypted server-side, streamed to you, decrypted in your browser.', icon: Download },
]

const STATS = [
  { value: '1000+', label: 'Supported Sites' },
  { value: '8K', label: 'Max Resolution' },
  { value: '256-bit', label: 'Encryption' },
  { value: '0', label: 'Data Stored' },
]

const FORMATS = [
  { icon: FileVideo, label: 'Video', formats: 'MP4, MKV, WebM' },
  { icon: Headphones, label: 'Audio', formats: 'MP3, AAC, FLAC, M4A' },
  { icon: Subtitles, label: 'Subtitles', formats: 'SRT, VTT, embedded' },
]

const QUALITY_TIERS = [
  { label: '8K', sub: '7680×4320', tag: 'HDR / Dolby Vision', size: '≈20–40 GB' },
  { label: '4K', sub: '3840×2160', tag: 'HDR10 / HDR10+', size: '≈5–12 GB' },
  { label: '1440p', sub: '2560×1440', tag: 'QHD', size: '≈2–4 GB' },
  { label: '1080p', sub: '1920×1080', tag: 'Full HD', size: '≈800 MB–1.5 GB' },
  { label: '720p', sub: '1280×720', tag: 'HD', size: '≈300–600 MB' },
  { label: '480p / 360p', sub: 'SD', tag: 'Mobile', size: '≈100–200 MB' },
]

const CAPABILITIES = [
  { icon: Film, title: 'Video, up to 8K HDR', desc: 'Every yt-dlp format exposed — 144p to 8K, HDR10, HDR10+, Dolby Vision.' },
  { icon: Mic2, title: 'Multi-audio tracks', desc: 'Pick original + dubs (Hindi, Spanish, etc.) and mux them into one MKV.' },
  { icon: Subtitles, title: 'Subtitles, every mode', desc: 'Soft-embedded, hard-burned, or sidecar .srt / .vtt files — your choice.' },
  { icon: Languages, title: 'Auto-captions too', desc: 'YouTube auto-generated captions in any language available.' },
  { icon: Music2, title: 'Audio-only extraction', desc: 'MP3, FLAC, AAC, M4A, OGG — highest bitrate, ID3 tags preserved.' },
  { icon: ImageIcon, title: 'Thumbnails + metadata', desc: 'Full-resolution cover art, chapters, descriptions, upload date.' },
  { icon: Gauge, title: 'Built-in browser', desc: 'Open pages inside a sandboxed private browser, then grab the video in one click.' },
  { icon: FileText, title: 'Bundled with video', desc: 'Download subtitles together with the video file in one click.' },
]

const COMPARE = [
  { feat: 'No account required', sv: true, others: false },
  { feat: 'Zero ads / trackers', sv: true, others: false },
  { feat: '8K HDR support', sv: true, others: false },
  { feat: 'Multi-audio tracks', sv: true, others: false },
  { feat: 'Subtitles (soft/hard/sidecar)', sv: true, others: false },
  { feat: 'AES-256-GCM end-to-end', sv: true, others: false },
  { feat: 'Open formats (MP4, MKV)', sv: true, others: true },
  { feat: 'Server stores your file', sv: false, others: true },
  { feat: 'Speed throttling', sv: false, others: true },
]

const FAQS = [
  { q: 'Is StreamVault free?', a: 'Yes. No account, no paywall, no daily quota, no ads. Ever.' },
  { q: 'Do you store my downloads?', a: 'No. Files are streamed encrypted through memory only and discarded the moment your browser finishes decrypting them.' },
  { q: 'What is the built-in browser?', a: 'A sandboxed, private in-app browser. Open any site inside it — no cookies are persisted, no trackers run, referrer is stripped. When a video plays, hit Detect & Download.' },
  { q: 'Why is the file encrypted?', a: 'So intermediaries (ISPs, your network, our own infrastructure) cannot read what you are downloading. The decryption key is generated in your browser and never sent to us.' },
  { q: 'Does it work on every site?', a: 'Anything yt-dlp supports — over 1 000 platforms. If a site refuses to render inside the in-app browser (X-Frame-Options), just paste the URL on the home page — the same private pipeline downloads it.' },
  { q: 'Can I get subtitles alongside the video?', a: 'Yes — pick languages in the picker and choose soft-embed (selectable in a player), hard-burn (always on screen), or sidecar .srt/.vtt files.' },
]

const TESTIMONIALS = [
  { name: 'Aarav K.', role: 'Filmmaker', text: 'Finally a downloader that gives me real 4K HDR with Dolby Vision intact. MKV + multi-audio is chef’s kiss.' },
  { name: 'Luna R.', role: 'Translator', text: 'The sidecar .srt download alone is worth bookmarking this site forever.' },
  { name: 'Marcus T.', role: 'Privacy nerd', text: 'No accounts, end-to-end encrypted, no ads. This is what the internet should feel like.' },
]

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [meta, setMeta] = useState<VideoMetadata | null>(null)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [jobId, setJobId] = useState('')
  const [keyBase64, setKeyBase64] = useState('')

  const handleAnalyze = useCallback(async (url: string) => {
    setPhase('loading')
    setMeta(null)
    try {
      const result = await fetchMeta(url)
      setMeta(result)
      setPhase('preview')
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to analyze URL')
      setPhase('idle')
    }
  }, [])

  const handleDownload = useCallback(
    async (params: { videoFormatId: string; audioTrackIds: string[]; subtitleLangs: string[]; subtitleMode: SubtitleMode; container: Container; subtitleFormat?: 'srt' | 'vtt' }) => {
      if (!meta) return
      setPhase('preparing')

      try {
        const req: DownloadRequest = { url: meta.url, ...params }
        const dlRes = await startDownload(req)
        setJobId(dlRes.jobId)
        setKeyBase64(dlRes.keyBase64)
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

        const waitProgress = new Promise<void>((resolve, reject) => {
          const es = openProgressStream(dlRes.jobId)
          es.addEventListener('progress', (e) => {
            const d = JSON.parse((e as MessageEvent).data)
            setProgress((prev) => prev ? { ...prev, serverProgress: d.progress, totalBytes: d.total, speed: d.speed } : prev)
          })
          es.addEventListener('done', () => { es.close(); resolve() })
          es.addEventListener('error', (e) => { es.close(); reject(new Error('Download failed on server')) })
        })

        await waitProgress

        setPhase('decrypt')
        setProgress((prev) => prev ? { ...prev, phase: 'decrypt' } : prev)

        const streamRes = await fetch(`${API_BASE}/api/stream/${dlRes.jobId}`)
        if (!streamRes.ok) throw new Error('Stream request failed')

        const blob = await decryptStream(streamRes, dlRes.keyBase64, (bytes) => {
          setProgress((prev) => {
            if (!prev) return prev
            const total = prev.totalBytes || bytes
            return { ...prev, decryptProgress: Math.min((bytes / total) * 100, 99) }
          })
        })

        setProgress((prev) => prev ? { ...prev, phase: 'done', serverProgress: 100, decryptProgress: 100 } : prev)
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

  return (
    <div className="relative">
      {/* ═══ Hero Section ═══ */}
      <section className="mx-auto max-w-4xl px-4 pb-8 pt-16 text-center sm:pt-24 lg:pt-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Status badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-[var(--accent-subtle)] px-4 py-1.5 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse_dot" />
            Free · No account · Zero data stored
          </div>

          <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Download{' '}
            <span className="gradient-text">Anything</span>
            ,<br className="hidden sm:block" />
            Instantly & Securely
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Ultra-HD video, audio, images and documents from 1 000+ platforms.
            Encrypted end-to-end with AES-256-GCM — no logs, no account required.
          </p>
        </motion.div>

        {/* URL Input */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <UrlInput
            onAnalyze={handleAnalyze}
            loading={phase === 'loading'}
            disabled={['server', 'decrypt'].includes(phase)}
          />
        </motion.div>

        {/* Supported platforms hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-faint"
        >
          <span>Works with YouTube, Instagram, TikTok, X, Reddit, Twitch & 1 000+ more</span>
          <Link href="/supported-sites" className="inline-flex items-center gap-0.5 text-accent hover:underline">
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </motion.div>

        {/* Built-in private browser CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
          className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] px-5 py-4 sm:flex-row sm:gap-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            <EyeOff className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-primary">Open a built-in private browser</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Browse any site without restrictions, no cookies stored, no trackers. When a video plays — one click downloads it.
            </p>
          </div>
          <Link
            href="/browser"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-600 sm:text-sm"
          >
            Launch Browser <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </section>

      {/* ═══ Dynamic Download Area ═══ */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <AnimatePresence mode="wait">
          {phase === 'preview' && meta && (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <PreviewCard meta={meta} lane={meta.lane} url={meta.url} />
              <FormatPicker meta={meta} onDownload={handleDownload} loading={false} />
            </motion.div>
          )}

          {phase === 'preparing' && (
            <motion.div key="preparing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 card p-10 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-2 border-t-accent" />
              <p className="text-sm text-muted">Preparing your download…</p>
            </motion.div>
          )}

          {(phase === 'server' || phase === 'decrypt' || phase === 'done') && progress && (
            <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DownloadProgress {...progress} />
              {phase === 'done' && (
                <button
                  onClick={() => { setPhase('idle'); setMeta(null); setProgress(null) }}
                  className="mt-4 w-full rounded-xl bg-surface py-3 text-sm text-muted border border-[var(--border)] transition hover:border-[var(--border-strong)] hover:text-primary"
                >
                  Download another
                </button>
              )}
            </motion.div>
          )}

          {phase === 'idle' && (
            <motion.div key="features" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Feature grid */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {FEATS.map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="card p-5 group">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] transition-transform group-hover:scale-110">
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="border-y border-[var(--border)] bg-surface/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-10 sm:grid-cols-4 lg:px-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold gradient-text sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-medium text-muted sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-6">
        <div className="mb-12 text-center">
          <span className="badge mb-4">Simple Process</span>
          <h2 className="text-2xl font-bold sm:text-3xl">How It Works</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">Three simple steps to download any media securely.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ step, title, desc, icon: Icon }, i) => (
            <div key={step} className="relative card p-6 text-center group">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <span className="absolute top-4 left-4 font-mono text-xs text-faint">{step}</span>
              <h3 className="text-base font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-faint md:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Supported Formats ═══ */}
      <section className="border-t border-[var(--border)] bg-surface/30">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-6">
          <div className="mb-12 text-center">
            <span className="badge mb-4">Flexible Output</span>
            <h2 className="text-2xl font-bold sm:text-3xl">All Major Formats</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">Download in your preferred format with full quality preservation.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {FORMATS.map(({ icon: Icon, label, formats }) => (
              <div key={label} className="card p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-primary">{label}</h3>
                <p className="mt-1 text-sm text-muted">{formats}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* \u2550\u2550\u2550 Quality Tiers \u2550\u2550\u2550 */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-6">
        <div className="mb-12 text-center">
          <span className="badge mb-4">Every Resolution</span>
          <h2 className="text-2xl font-bold sm:text-3xl">From 144p to 8K HDR</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Pick the exact quality you need. Size estimates shown before you commit — no surprises.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUALITY_TIERS.map((q) => (
            <div key={q.label} className="card p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-primary">{q.label}</p>
                <p className="font-mono text-xs text-faint">{q.sub}</p>
                <p className="mt-1 text-xs text-muted">{q.tag}</p>
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted ring-1 ring-[var(--border)]">
                {q.size}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* \u2550\u2550\u2550 What You Can Download \u2550\u2550\u2550 */}
      <section className="border-t border-[var(--border)] bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
          <div className="mb-12 text-center">
            <span className="badge mb-4">Capabilities</span>
            <h2 className="text-2xl font-bold sm:text-3xl">Everything in one place</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">Video, audio, captions, thumbnails, metadata — grab any combination, in any container.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm font-semibold text-primary">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* \u2550\u2550\u2550 Comparison Table \u2550\u2550\u2550 */}
      <section className="mx-auto max-w-4xl px-4 py-20 lg:px-6">
        <div className="mb-12 text-center">
          <span className="badge mb-4">Why StreamVault</span>
          <h2 className="text-2xl font-bold sm:text-3xl">Not like the others</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">A no-nonsense comparison with the ad-riddled “download” sites.</p>
        </div>
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px] border-b border-[var(--border)] bg-surface-2/40 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-faint">
            <div>Feature</div>
            <div className="text-center text-accent">StreamVault</div>
            <div className="text-center">Others</div>
          </div>
          {COMPARE.map((row, i) => (
            <div
              key={row.feat}
              className={cn(
                'grid grid-cols-[1fr_120px_120px] items-center px-5 py-3 text-sm',
                i !== COMPARE.length - 1 && 'border-b border-[var(--border)]'
              )}
            >
              <div className="text-secondary">{row.feat}</div>
              <div className="flex justify-center">
                {row.sv ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-faint" />}
              </div>
              <div className="flex justify-center">
                {row.others ? <CheckCircle2 className="h-5 w-5 text-faint" /> : <XCircle className="h-5 w-5 text-danger opacity-70" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* \u2550\u2550\u2550 No-Ads Manifesto \u2550\u2550\u2550 */}
      <section className="border-t border-[var(--border)] bg-surface/30">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-6">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/20">
            <EyeOff className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">Built like Brave — zero ads, zero trackers</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted">
            No banner ads. No popups. No “wait 30 seconds” timers. No fake download buttons. No newsletter modals.
            No analytics scripts. No cookies. No third-party iframes. No fingerprinting.
            <br className="hidden sm:block" />
            What you see is the entire product.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Gauge, label: '0 ad slots' },
              { icon: Shield, label: '0 tracker domains' },
              { icon: InfinityIcon, label: 'Unlimited downloads' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="card p-5">
                <Icon className="mx-auto mb-2 h-5 w-5 text-purple-400" />
                <p className="text-sm font-semibold text-primary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* \u2550\u2550\u2550 Testimonials \u2550\u2550\u2550 */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-6">
        <div className="mb-12 text-center">
          <span className="badge mb-4">Loved by power users</span>
          <h2 className="text-2xl font-bold sm:text-3xl">What people say</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-secondary">“{t.text}”</p>
              <div className="mt-4 border-t border-[var(--border)] pt-3">
                <p className="text-sm font-semibold text-primary">{t.name}</p>
                <p className="text-xs text-faint">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* \u2550\u2550\u2550 FAQ \u2550\u2550\u2550 */}
      <section className="border-t border-[var(--border)] bg-surface/30">
        <div className="mx-auto max-w-3xl px-4 py-20 lg:px-6">
          <div className="mb-10 text-center">
            <span className="badge mb-4">FAQ</span>
            <h2 className="text-2xl font-bold sm:text-3xl">Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-primary">
                  {q}
                  <ChevronRight className="h-4 w-4 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-faint">
            More questions? See the full <Link href="/faq" className="text-accent hover:underline">FAQ</Link> or <Link href="/contact" className="text-accent hover:underline">contact us</Link>.
          </p>
        </div>
      </section>

      {/* ═══ Trust / Security CTA ═══ */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-6">
        <div className="card overflow-hidden">
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-10">
            <div>
              <span className="badge mb-4">Enterprise-Grade Security</span>
              <h2 className="text-2xl font-bold sm:text-3xl">Your Privacy is Our Priority</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Every download is encrypted with a unique AES-256-GCM key generated per session.
                The key exists only in your browser memory — we never see it, store it, or log it.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'End-to-end AES-256-GCM encryption',
                  'Zero server-side data retention',
                  'No cookies, no accounts, no tracking',
                  'Your IP never reaches the target site',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-secondary">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/security"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white dark:text-black transition hover:shadow-glow"
                >
                  <Shield className="h-4 w-4" />
                  Learn More
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-surface px-5 py-2.5 text-sm font-medium text-muted transition hover:text-primary hover:border-[var(--border-strong)]"
                >
                  How It Works
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center justify-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--accent-subtle)] shadow-glow">
                <Shield className="h-12 w-12 text-accent" />
              </div>
              <div className="flex gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-bg)]">
                  <Lock className="h-6 w-6 text-success" />
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--warning-bg)]">
                  <Zap className="h-6 w-6 text-warning" />
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="border-t border-[var(--border)] bg-surface/30">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center lg:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to Download?</h2>
          <p className="mt-3 text-muted">Free, private, and instant. No sign-up required.</p>
          <div className="mt-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white dark:text-black transition hover:shadow-glow-strong hover:scale-[1.02]"
            >
              <Download className="h-4 w-4" />
              Start Downloading
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
