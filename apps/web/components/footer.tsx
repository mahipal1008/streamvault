import Link from 'next/link'
import { Shield, Github, ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-background/50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 font-semibold text-primary">StreamVault</p>
            <p className="text-sm leading-relaxed text-muted">
              Privacy-first universal content downloader. No accounts, no logs, no stored data.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-faint">Product</p>
            <ul className="space-y-2 text-sm text-muted">
              {[['/', 'Downloader'], ['/supported-sites', 'Supported Sites']].map(([href, label]) => (
                <li key={href}><Link href={href} className="hover:text-primary transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-faint">Info</p>
            <ul className="space-y-2 text-sm text-muted">
              {[['/security', 'Security & Privacy'], ['/legal', 'Legal']].map(([href, label]) => (
                <li key={href}><Link href={href} className="hover:text-primary transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-faint">Security</p>
            <div className="flex items-start gap-2 rounded-lg bg-surface p-3 ring-1 ring-white/5">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
              <p className="text-xs text-muted leading-relaxed">
                AES-256-GCM end-to-end encryption. Your key never leaves your browser.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} StreamVault. Personal use only.</p>
          <p className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Powered by yt-dlp + ffmpeg
          </p>
        </div>
      </div>
    </footer>
  )
}
