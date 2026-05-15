import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Link2, Search, Settings2, ShieldCheck, Unlock,
  ArrowRight, Download, Server, Monitor, Lock,
} from 'lucide-react'

export const metadata: Metadata = { title: 'How It Works' }

const STEPS = [
  {
    num: '01',
    icon: Link2,
    title: 'Paste Your URL',
    desc: 'Copy any media URL from a supported platform and paste it into the input field. StreamVault\'s URL parser automatically detects the platform (YouTube, Instagram, TikTok, etc.) and validates the link format before proceeding.',
    details: [
      'Supports 1,000+ platforms via yt-dlp extractors',
      'Automatic platform detection and URL validation',
      'Handles playlists, shorts, stories, and direct links',
    ],
  },
  {
    num: '02',
    icon: Search,
    title: 'Server-Side Analysis',
    desc: 'The server fetches metadata from the source platform without exposing your IP address. This includes available resolutions, audio tracks, subtitle languages, file sizes, and thumbnail data — all extracted server-side.',
    details: [
      'Your IP is never sent to the target platform',
      'Metadata extraction via yt-dlp on the server',
      'Two-lane geo-bypass: direct and residential proxy',
    ],
  },
  {
    num: '03',
    icon: Settings2,
    title: 'Choose Your Format',
    desc: 'Select your preferred video quality (up to 8K), audio tracks (multi-language), subtitle languages, and output container format. StreamVault shows you exactly what\'s available before you commit to downloading.',
    details: [
      'Video: MP4, MKV, WebM up to 8K HDR',
      'Audio: MP3, AAC, FLAC, M4A, Opus',
      'Subtitles: SRT, VTT, or embedded in container',
    ],
  },
  {
    num: '04',
    icon: ShieldCheck,
    title: 'Encrypted Download',
    desc: 'The server downloads and muxes the media, then encrypts the entire file with a fresh AES-256-GCM key unique to your session. The encrypted stream is sent to your browser over TLS 1.3 — double encryption in transit.',
    details: [
      'Unique 256-bit key generated per download',
      'Key sent to browser, never stored on server',
      'File deleted from server immediately after streaming',
    ],
  },
  {
    num: '05',
    icon: Unlock,
    title: 'Client-Side Decryption',
    desc: 'Your browser receives the encrypted stream and decrypts it locally using the Web Crypto API. The decryption key exists only in JavaScript memory — when you close the tab, it\'s gone. The decrypted file is saved directly to your device.',
    details: [
      'Web Crypto API — native browser decryption',
      'Key held in memory only, never persisted',
      'Decrypted file saved straight to your Downloads',
    ],
  },
]

const FLOW_STEPS = [
  { label: 'Browser', icon: Monitor },
  { label: 'API Server', icon: Server },
  { label: 'yt-dlp + ffmpeg', icon: Settings2 },
  { label: 'AES-256 Encrypt', icon: Lock },
  { label: 'Encrypted Stream', icon: ShieldCheck },
  { label: 'Browser Decrypt', icon: Unlock },
]

export default function HowItWorksPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <Settings2 className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          How <span className="gradient-text">StreamVault</span> Works
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          A five-step encrypted pipeline from URL to file — with zero data retained.
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="space-y-6">
          {STEPS.map(({ num, icon: Icon, title, desc, details }) => (
            <div key={num} className="card p-6 sm:p-8">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-mono text-xs font-bold text-faint">{num}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
                  <ul className="mt-4 space-y-2">
                    {details.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-secondary">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]/30">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="mb-12 text-center">
            <span className="badge mb-4">Architecture</span>
            <h2 className="text-2xl font-bold sm:text-3xl">Data Flow Overview</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              The complete path from your browser to the downloaded file.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="card overflow-x-auto p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2 min-w-[600px]">
              {FLOW_STEPS.map(({ label, icon: Icon }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <span className="text-xs font-medium text-muted whitespace-nowrap">{label}</span>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <ArrowRight className="mx-1 h-4 w-4 flex-shrink-0 text-faint" />
                  )}
                </div>
              ))}
            </div>

            {/* Text description */}
            <div className="mt-8 rounded-xl bg-[var(--surface-2)] p-4 font-mono text-xs leading-relaxed text-muted">
              <p>Browser → HTTPS POST /api/analyze → Server extracts metadata via yt-dlp</p>
              <p className="mt-1">Browser → HTTPS POST /api/download → Server downloads via yt-dlp + muxes via ffmpeg</p>
              <p className="mt-1">Server → AES-256-GCM encrypt → Encrypted stream → Browser</p>
              <p className="mt-1">Browser → Web Crypto API decrypt → Save to disk → Key discarded</p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 rounded-2xl border border-[var(--success)]/20 bg-[var(--success-bg)] p-5">
            <p className="text-sm font-semibold text-[var(--success)]">End-to-End Privacy</p>
            <p className="mt-1 text-sm text-muted">
              At no point does your IP address reach the target platform. The server acts
              as a proxy, and the downloaded file exists in server memory only during
              encryption and streaming — then it's permanently deleted.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Ready to Try It?</h2>
        <p className="mb-8 text-muted">
          Free, private, and instant. No sign-up required.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:shadow-[var(--shadow-glow-strong)] hover:scale-[1.02] dark:text-black"
        >
          <Download className="h-4 w-4" />
          Start Downloading
        </Link>
      </section>
    </div>
  )
}
