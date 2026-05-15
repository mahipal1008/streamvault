import type { Metadata } from 'next'
import { Shield, Lock, Database, Eye, Server, Key, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Security & Privacy' }

const POINTS = [
  {
    icon: Lock,
    title: 'AES-256-GCM End-to-End Encryption',
    desc: 'Every file is encrypted on the server with a fresh 256-bit random key before streaming to your browser. The key is returned to your browser in the API response and never stored anywhere on the server. Decryption happens entirely client-side via the Web Crypto API.',
  },
  {
    icon: Key,
    title: 'Your Key Stays in Your Browser',
    desc: 'The AES key is held in JavaScript memory only (never in localStorage, cookies, or URL bar). When you close the tab, the key is gone. No one — not us, not your ISP, not an intercepting proxy — can decrypt your download without your browser.',
  },
  {
    icon: Database,
    title: 'Zero Data Storage',
    desc: 'No database. No Redis. No log files. Job state lives in an in-memory Map on the server, auto-pruned after 30 minutes. The downloaded file is written to RAM-backed tmpfs (/tmp in Docker) and deleted immediately after streaming. Nothing persists.',
  },
  {
    icon: Eye,
    title: 'No Tracking, No Analytics',
    desc: 'No cookies, no sessions, no user accounts. No third-party scripts. No analytics. No Sentry. Your IP is stripped from all internal calls. robots.txt disallows all crawlers.',
  },
  {
    icon: Server,
    title: 'Two-Lane Geo-Bypass',
    desc: 'Downloads route through Direct (Render worker IP) or Residential Proxy lane based on real-time health scoring. If a site blocks by geography, the system auto-retries via proxy. Your real IP is never sent to the target site.',
  },
  {
    icon: Shield,
    title: 'CIA Triad Enforcement',
    desc: 'Confidentiality: TLS 1.3 + AES-256-GCM double encryption. Integrity: per-chunk AEAD tags + SHA-256 manifest. Availability: multi-lane auto-failover with 15s health checks. HSTS + strict CSP + X-Content-Type-Options headers on all responses.',
  },
]

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
      <div className="mb-12 text-center">
        <span className="badge mb-4">Enterprise Grade</span>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] shadow-glow">
          <Shield className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Security & Privacy</h1>
        <p className="mx-auto max-w-lg text-muted">
          How StreamVault protects you and your data — technically and operationally.
        </p>
      </div>

      <div className="space-y-4">
        {POINTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-6 group">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-base font-semibold text-primary">{title}</h2>
            </div>
            <p className="pl-[52px] text-sm leading-relaxed text-muted">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card overflow-hidden">
        <div className="bg-[var(--success-bg)] p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-success">Open Source Transparency</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                This project is built on open-source components: yt-dlp, ffmpeg, Fastify, Next.js.
                The encryption logic is standard AES-GCM — you can audit it in your browser devtools.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          Read our Privacy Policy
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
