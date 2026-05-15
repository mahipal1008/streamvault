import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield, Lock, Eye, Code2, Server, Heart,
  ArrowRight, CheckCircle2, Cpu, Globe,
} from 'lucide-react'

export const metadata: Metadata = { title: 'About' }

const DIFFERENTIATORS = [
  {
    icon: Code2,
    title: 'Built on Open-Source Tools',
    desc: 'StreamVault is powered by yt-dlp, ffmpeg, and other auditable, community-maintained projects. No proprietary black boxes.',
  },
  {
    icon: Eye,
    title: 'No Cloud Storage',
    desc: 'Downloaded files are never persisted on any server. They exist in memory only during the encrypted streaming process, then vanish.',
  },
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    desc: 'Every download is encrypted server-side with a unique key that only exists in your browser memory. We never see, store, or log it.',
  },
  {
    icon: Shield,
    title: 'Zero Tracking',
    desc: 'No accounts, no cookies, no analytics, no third-party scripts. Your usage is invisible — even to us.',
  },
]

const TECH = [
  { label: 'yt-dlp', desc: 'Media extraction from 1 000+ sites' },
  { label: 'ffmpeg', desc: 'Format conversion and audio/video muxing' },
  { label: 'Next.js 15', desc: 'React framework for the web interface' },
  { label: 'Fastify', desc: 'High-performance API server' },
  { label: 'AES-256-GCM', desc: 'Military-grade authenticated encryption' },
  { label: 'Web Crypto API', desc: 'Browser-native client-side decryption' },
]

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <Heart className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          About <span className="gradient-text">StreamVault</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          A privacy-first media downloader built for people who believe
          downloading should be simple, secure, and completely private.
        </p>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <span className="badge mb-4">Our Mission</span>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
          Privacy-First Media Downloading
        </h2>
        <p className="leading-relaxed text-muted">
          The internet is full of media download tools that harvest your data, inject ads,
          and store your files on their servers indefinitely. StreamVault was built to be
          different. We believe that downloading content you have the right to access should
          not require surrendering your privacy. Every architectural decision — from in-memory
          processing to per-session encryption keys — was made with one goal: your data stays yours.
        </p>
      </section>

      {/* How We're Different */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]/30">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="mb-12 text-center">
            <span className="badge mb-4">What Sets Us Apart</span>
            <h2 className="text-2xl font-bold sm:text-3xl">
              How StreamVault Is Different
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              We don't just say we care about privacy — we architected the entire system around it.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {DIFFERENTIATORS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 group">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Philosophy */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <span className="badge mb-4">Our Philosophy</span>
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Built by Privacy Advocates</h2>
        <p className="leading-relaxed text-muted">
          StreamVault isn't a company. There's no VC funding, no growth targets, no user
          monetization strategy. It's a tool built by people who got tired of sketchy
          download sites and decided to build something better — for personal use, by
          personal conviction.
        </p>
        <div className="mt-6 space-y-3">
          {[
            'No investors, no board, no growth pressure',
            'Built for personal use, shared because others need it too',
            'Privacy is a design constraint, not a marketing claim',
            'Open-source tooling you can audit yourself',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-secondary">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]/30">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="mb-12 text-center">
            <span className="badge mb-4">Under the Hood</span>
            <h2 className="text-2xl font-bold sm:text-3xl">Tech Stack</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Built on battle-tested, open-source technology.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TECH.map(({ label, desc }) => (
              <div key={label} className="card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  <span className="font-mono text-sm font-semibold text-primary">{label}</span>
                </div>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
          Want the Full Security Deep-Dive?
        </h2>
        <p className="mb-8 text-muted">
          Learn exactly how we encrypt, stream, and purge every download.
        </p>
        <Link
          href="/security"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:shadow-[var(--shadow-glow)] dark:text-black"
        >
          <Shield className="h-4 w-4" />
          Security & Privacy
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  )
}
