import type { Metadata } from 'next'
import { Shield, Lock, Database, Eye, Server, Key } from 'lucide-react'

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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
          <Shield className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">Security & Privacy</h1>
        <p className="text-muted">How StreamVault protects you and your data — technically and operationally.</p>
      </div>

      <div className="space-y-4">
        {POINTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-white/8 bg-surface p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Icon className="h-4.5 w-4.5 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-primary">{title}</h2>
            </div>
            <p className="pl-12 text-sm leading-relaxed text-muted">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-success/20 bg-success/5 p-5">
        <p className="text-sm font-semibold text-success">Open Source Transparency</p>
        <p className="mt-1 text-sm text-muted">
          This project is built on open-source components: yt-dlp, ffmpeg, Fastify, Next.js. The encryption logic is standard AES-GCM — you can audit it in your browser devtools.
        </p>
      </div>
    </div>
  )
}
