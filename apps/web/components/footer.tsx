import Link from 'next/link'
import { Shield, Download, Heart } from 'lucide-react'

const PRODUCT_LINKS = [
  { href: '/', label: 'Downloader' },
  { href: '/supported-sites', label: 'Supported Platforms' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
]

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/security', label: 'Security & Privacy' },
  { href: '/contact', label: 'Contact' },
]

const LEGAL_LINKS = [
  { href: '/legal', label: 'Legal Disclaimer' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
]

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)]" style={{ background: 'var(--footer-bg)' }}>
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
                <Download className="h-4 w-4 text-accent" />
              </span>
              <span className="gradient-text text-lg font-bold">StreamVault</span>
            </Link>
            <p className="mb-4 max-w-xs text-sm leading-relaxed text-muted">
              Privacy-first universal media downloader. No accounts, no logs, no stored data. Your downloads are encrypted end-to-end.
            </p>
            <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-surface p-3 max-w-xs">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
              <p className="text-xs text-muted leading-relaxed">
                AES-256-GCM encryption. Your key never leaves your browser.
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 section-heading">Product</p>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 section-heading">Company</p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 section-heading">Legal</p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} StreamVault. All rights reserved. Personal use only.</p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-error" /> for privacy
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
