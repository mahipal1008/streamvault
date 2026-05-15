'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'What is StreamVault?',
    a: 'StreamVault is a privacy-first media downloader that lets you download video, audio, and other media from 1,000+ platforms. Everything is encrypted end-to-end with AES-256-GCM, and absolutely no data is stored on our servers.',
  },
  {
    q: 'Is StreamVault free?',
    a: "Yes, StreamVault is completely free to use. There are no hidden fees, no premium tiers required for basic functionality, and no ads. We don't monetize your data because we don't collect any.",
  },
  {
    q: 'Do I need to create an account?',
    a: "No. StreamVault requires no account, no email, no sign-up of any kind. Just paste a URL and download. We designed it this way because accounts create data we'd have to protect — so we eliminated them entirely.",
  },
  {
    q: 'What sites are supported?',
    a: 'StreamVault supports over 1,000 platforms including YouTube, Instagram, TikTok, X (Twitter), Reddit, Twitch, Vimeo, SoundCloud, Facebook, Dailymotion, and many more. Visit the Supported Sites page for the full list.',
  },
  {
    q: "What's the maximum video quality?",
    a: 'StreamVault supports up to 8K (4320p) resolution where available, including HDR10 and Dolby Vision content. The available quality depends on what the source platform provides for the specific content.',
  },
  {
    q: 'How does the encryption work?',
    a: 'When you request a download, the server generates a unique AES-256-GCM key per session. The file is encrypted on the server before streaming to your browser. The key is sent to your browser and held in JavaScript memory only — never stored in cookies, localStorage, or URLs. Your browser decrypts the file client-side using the Web Crypto API.',
  },
  {
    q: 'Is my data stored anywhere?',
    a: 'No. StreamVault has no database. Job state lives in an in-memory Map that auto-prunes after 30 minutes. Downloaded files are written to RAM-backed tmpfs and deleted immediately after streaming. When you close the tab, the encryption key in your browser memory is gone forever.',
  },
  {
    q: 'Is this legal?',
    a: 'StreamVault is a tool. Like any tool, it can be used responsibly or irresponsibly. You are responsible for ensuring you have the right to download the content you access. Downloading content you own, content under Creative Commons, or content where the creator allows downloads is perfectly legal. Downloading copyrighted content without permission is not.',
  },
  {
    q: 'Can I download audio only?',
    a: 'Yes. StreamVault supports audio-only downloads in multiple formats including MP3, AAC, FLAC, M4A, and Opus. You can extract audio from any video source or download from audio-only platforms like SoundCloud.',
  },
  {
    q: 'What formats are supported?',
    a: 'Video: MP4, MKV, WebM. Audio: MP3, AAC, FLAC, M4A, Opus. Subtitles: SRT, VTT, or embedded into the video container. You can choose your preferred format and quality before downloading.',
  },
  {
    q: 'Why does my download take long?',
    a: 'Download speed depends on several factors: the source platform\'s server speed, the file size (8K video files can be very large), current server load, and your own internet connection. The encryption and decryption process adds minimal overhead — typically less than 5% of total download time.',
  },
  {
    q: 'Is StreamVault open source?',
    a: 'StreamVault is built on open-source components including yt-dlp, ffmpeg, Next.js, and Fastify. The encryption uses standard AES-256-GCM which you can audit in your browser devtools. We believe in transparency through auditable technology.',
  },
]

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <HelpCircle className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Everything you need to know about StreamVault. Can&apos;t find the answer?
          Check our security page for technical deep-dives.
        </p>
      </section>

      {/* FAQ List */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="space-y-3">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[var(--surface-2)]/50"
              >
                <span className="text-sm font-semibold text-primary">{q}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  openIndex === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-[var(--border)] px-5 pb-5 pt-4 text-sm leading-relaxed text-muted">
                    {a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm font-semibold text-primary">Still have questions?</p>
          <p className="mt-1 text-sm text-muted">
            Check our{' '}
            <a href="/security" className="text-accent hover:underline">
              Security page
            </a>{' '}
            for technical details or visit{' '}
            <a href="/how-it-works" className="text-accent hover:underline">
              How It Works
            </a>{' '}
            for a step-by-step walkthrough.
          </p>
        </div>
      </section>
    </div>
  )
}
