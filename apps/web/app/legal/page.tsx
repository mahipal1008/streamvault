import type { Metadata } from 'next'
import { Scale, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Legal Disclaimer' }

const SECTIONS = [
  {
    title: 'Personal Use Only',
    text: 'StreamVault is a personal tool intended for downloading content you have the legal right to download — such as your own uploads, content under Creative Commons or other open licenses, or content where the platform explicitly permits downloading.',
  },
  {
    title: 'Copyright',
    text: "Downloading copyrighted content without the copyright holder's permission may violate copyright law in your jurisdiction. You are solely responsible for ensuring your use of this tool complies with applicable laws and the terms of service of the platforms you access.",
  },
  {
    title: 'No Warranty',
    text: 'This software is provided "as is" without warranty of any kind. We make no guarantees about availability, accuracy, or fitness for any particular purpose.',
  },
  {
    title: 'Privacy',
    text: 'We do not collect, store, or share any personal data.',
    link: { href: '/security', label: 'See our Security page for full details' },
  },
  {
    title: 'DMCA',
    text: 'StreamVault does not host or cache any content. It acts as a client-side tool to interface with publicly available streaming protocols. We are not responsible for the content accessed through this tool.',
  },
]

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] shadow-glow">
          <Scale className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Legal Disclaimer</h1>
        <p className="mx-auto max-w-lg text-muted">
          Important legal information about using StreamVault.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map(({ title, text, link }, i) => (
          <div key={title} className="card p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-[var(--border)] font-mono text-xs text-muted">
                {i + 1}
              </span>
              <div>
                <h2 className="mb-2 text-base font-semibold text-primary">{title}</h2>
                <p className="text-sm leading-relaxed text-muted">{text}</p>
                {link && (
                  <Link
                    href={link.href}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    {link.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/terms" className="text-accent hover:underline flex items-center gap-1">
          Terms of Service <ArrowRight className="h-3 w-3" />
        </Link>
        <span className="text-faint">•</span>
        <Link href="/privacy" className="text-accent hover:underline flex items-center gap-1">
          Privacy Policy <ArrowRight className="h-3 w-3" />
        </Link>
        <span className="text-faint">•</span>
        <Link href="/security" className="text-accent hover:underline flex items-center gap-1">
          Security <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
