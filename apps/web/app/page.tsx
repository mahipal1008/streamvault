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
import { Shield, Zap, Lock, Globe } from 'lucide-react'

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
  { icon: Globe, title: '1000+ Sites', desc: 'YouTube, TikTok, Instagram, X, Reddit & more' },
  { icon: Zap, title: 'Up to 8K HDR', desc: 'Ultra-HD video with multi-audio tracks' },
  { icon: Lock, title: 'AES-256-GCM', desc: 'End-to-end encrypted, key stays in your browser' },
  { icon: Shield, title: 'Zero Logs', desc: 'No accounts, no tracking, no data stored' },
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
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-16 text-center sm:pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse_dot" />
            Free · No account · Zero data stored
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Download{' '}
            <span className="gradient-text">Anything</span>
            ,<br />
            Instantly
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base text-muted sm:text-lg">
            Ultra-HD video, audio, images and documents from 1000+ platforms. Encrypted end-to-end, no logs, no account required.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <UrlInput
            onAnalyze={handleAnalyze}
            loading={phase === 'loading'}
            disabled={['server', 'decrypt'].includes(phase)}
          />
        </motion.div>
      </section>

      {/* Dynamic area */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <AnimatePresence mode="wait">
          {phase === 'preview' && meta && (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <PreviewCard meta={meta} lane={meta.lane} url={meta.url} />
              <FormatPicker meta={meta} onDownload={handleDownload} loading={false} />
            </motion.div>
          )}

          {phase === 'preparing' && (
            <motion.div key="preparing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-surface p-10 text-center">
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
                  className="mt-4 w-full rounded-xl bg-surface py-3 text-sm text-muted ring-1 ring-white/5 transition hover:ring-white/15 hover:text-primary"
                >
                  Download another
                </button>
              )}
            </motion.div>
          )}

          {phase === 'idle' && (
            <motion.div key="features" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6 grid gap-3 sm:grid-cols-2">
              {FEATS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass rounded-2xl p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <p className="mt-0.5 text-xs text-muted">{desc}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
