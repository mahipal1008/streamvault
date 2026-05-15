'use client'

import { useState, useMemo } from 'react'
import { Search, Globe, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { category: 'Video', color: '#ef4444', sites: ['YouTube', 'Vimeo', 'Dailymotion', 'Rumble', 'Odysee', 'Bitchute', 'PeerTube', 'Metacafe', 'Veoh', 'Streamable', 'Coub', 'Gfycat', 'Imgur'] },
  { category: 'Social Media', color: '#3b82f6', sites: ['Instagram', 'Twitter / X', 'TikTok', 'Facebook', 'Reddit', 'LinkedIn', 'Pinterest', 'Snapchat', 'Telegram', 'Mastodon', 'Bluesky'] },
  { category: 'Live & Gaming', color: '#8b5cf6', sites: ['Twitch', 'Kick', 'YouTube Live', 'Nimo TV', 'AfreecaTV', 'VK Video', 'BIGO Live'] },
  { category: 'Music', color: '#f97316', sites: ['SoundCloud', 'Bandcamp', 'Mixcloud', 'Audiomack', 'Jamendo', 'NoiseTrade', 'HearThis.at'] },
  { category: 'News & Media', color: '#eab308', sites: ['BBC', 'CNN', 'ESPN', 'NBC News', 'ABC News', 'Al Jazeera', 'Bloomberg', 'Sky News', 'France 24', 'DW News'] },
  { category: 'Education', color: '#22c55e', sites: ['TED', 'Khan Academy', 'MIT OpenCourseWare', 'National Geographic', 'Discovery', 'PBS'] },
  { category: 'Asian Platforms', color: '#ec4899', sites: ['Bilibili', 'Youku', 'iQIYI', 'Weibo', 'Douyin', 'Niconico', 'AbemaTV', 'Viu', 'WeTV'] },
  { category: 'Other', color: '#6b7280', sites: ['Vevo', 'OK.ru', 'VK', 'Generic M3U8', 'Generic MPEG-DASH', 'Direct MP4/MP3 URLs'] },
]

const ALL_SITES = CATEGORIES.flatMap((c) => c.sites)

export default function SupportedSitesPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES
    const q = search.toLowerCase()
    return CATEGORIES
      .map((cat) => ({
        ...cat,
        sites: cat.sites.filter((s) => s.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.sites.length > 0)
  }, [search])

  const totalShown = filtered.reduce((sum, c) => sum + c.sites.length, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-6 lg:py-20">
      <div className="mb-10 text-center">
        <span className="badge mb-4">1 000+ Platforms</span>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Supported Platforms</h1>
        <p className="mx-auto max-w-lg text-muted">
          {ALL_SITES.length}+ platforms and growing. Powered by yt-dlp.
        </p>
      </div>

      {/* Search bar */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search platforms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-surface py-3 pl-10 pr-4 text-sm text-primary placeholder:text-faint outline-none transition focus:border-accent/50 focus:shadow-glow"
          />
          {search && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
              {totalShown}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {filtered.map((cat) => (
          <div key={cat.category} className="card p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
              <h2 className="text-sm font-semibold text-primary">{cat.category}</h2>
              <span className="ml-auto rounded-md bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-muted border border-[var(--border)]">
                {cat.sites.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.sites.map((s) => (
                <span
                  key={s}
                  className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted border border-[var(--border)] transition hover:border-[var(--border-strong)] hover:text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <Globe className="mx-auto mb-3 h-8 w-8 text-faint" />
            <p className="text-sm text-muted">No platforms match &ldquo;{search}&rdquo;</p>
            <p className="mt-1 text-xs text-faint">Try pasting the URL directly — it may still work.</p>
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <p className="text-sm text-faint mb-4">
          yt-dlp supports 1000+ extractors. Not seeing your site? Try pasting the URL directly — it may still work.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white dark:text-black transition hover:shadow-glow"
        >
          Try It Now
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
