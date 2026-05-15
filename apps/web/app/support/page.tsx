import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LifeBuoy, Mail, MessageCircle, HelpCircle, ShieldCheck, BookOpen, Zap,
  AlertTriangle, Globe, Download, RefreshCcw, Clock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support — get help with StreamVault',
  description: 'Help center, troubleshooting, and contact for StreamVault. Free, private, no account required.',
}

const QUICK_LINKS = [
  { href: '/faq', label: 'Frequently Asked Questions', icon: HelpCircle, desc: 'Quick answers to common questions.' },
  { href: '/how-it-works', label: 'How It Works', icon: BookOpen, desc: 'End-to-end pipeline, explained.' },
  { href: '/security', label: 'Security & Privacy', icon: ShieldCheck, desc: 'Encryption, zero-logs, and threat model.' },
  { href: '/supported-sites', label: 'Supported Platforms', icon: Globe, desc: '1 000+ sites and counting.' },
  { href: '/browser', label: 'Private Browser', icon: Globe, desc: 'Built-in ad-blocked browser.' },
  { href: '/contact', label: 'Contact', icon: Mail, desc: 'Reach the team directly.' },
]

const TROUBLES = [
  {
    icon: AlertTriangle,
    title: 'Download fails or times out',
    body:
      'Re-paste the URL. If it still fails, the source may require sign-in or geo-blocked. Try a different mirror, or paste the direct video page URL (not a playlist).',
  },
  {
    icon: RefreshCcw,
    title: '"Site refused to load" in the in-app browser',
    body:
      'Many large platforms set X-Frame-Options that prevent iframe embedding. This is a browser security feature, not a bug. Paste the URL into the address bar and hit Detect & Download — the private pipeline still works.',
  },
  {
    icon: Clock,
    title: 'Analyze is slow on first request',
    body:
      'The API server may be cold-starting (free tier). Subsequent requests are instant. Once warm, analyze typically completes in under a second.',
  },
  {
    icon: Zap,
    title: 'Download speed feels slow',
    body:
      'Speed is bound by your network and the source server. We stream the file directly from origin → encrypt → send to your browser with no intermediate buffering, so we never slow you down.',
  },
  {
    icon: Download,
    title: 'Subtitle file is empty',
    body:
      'Not every video has subtitles. If "auto" subtitles exist, select them in the picker. The .srt button only appears after you pick at least one language.',
  },
  {
    icon: ShieldCheck,
    title: 'Is this safe?',
    body:
      'Yes. Files are AES-256-GCM encrypted on the server, decryption key never leaves your browser, and we keep zero logs of any kind. See /security for the full threat model.',
  },
]

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
          <LifeBuoy className="h-6 w-6 text-accent" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Support</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Free, private, no account required. Search the docs below or reach out — we read every message.
        </p>
      </div>

      {/* Quick links */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-surface/60 p-4 transition-all hover:border-accent/40 hover:bg-surface hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20 transition group-hover:ring-accent/40">
              <Icon className="h-4 w-4 text-accent" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">{label}</p>
              <p className="mt-0.5 text-xs text-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Troubleshooting */}
      <div className="mt-14">
        <h2 className="text-xl font-bold tracking-tight">Troubleshooting</h2>
        <p className="mt-1 text-sm text-muted">Common issues and how to resolve them in under 30 seconds.</p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {TROUBLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-[var(--border)] bg-surface/60 p-5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-primary">{title}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-14 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-accent/5 via-surface/60 to-purple-500/5 p-8 text-center">
        <MessageCircle className="mx-auto h-6 w-6 text-accent" />
        <h2 className="mt-3 text-xl font-bold">Still need help?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          We respond within one business day. No account required — just describe what happened and which URL you tried.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] dark:text-black"
        >
          <Mail className="h-4 w-4" />
          Contact us
        </Link>
      </div>

      {/* Health badge */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-faint">
        <span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden />
        All systems operational — API, downloader, encryption gateway
      </div>
    </div>
  )
}
