import type { Metadata } from 'next'
import { Search } from 'lucide-react'

export const metadata: Metadata = { title: 'Supported Sites' }

const CATEGORIES = [
  { category: 'Video', color: '#ff4444', sites: ['YouTube', 'Vimeo', 'Dailymotion', 'Rumble', 'Odysee', 'Bitchute', 'PeerTube', 'Metacafe', 'Veoh', 'Streamable', 'Coub', 'Gfycat', 'Imgur'] },
  { category: 'Social Media', color: '#00d4ff', sites: ['Instagram', 'Twitter / X', 'TikTok', 'Facebook', 'Reddit', 'LinkedIn', 'Pinterest', 'Snapchat', 'Telegram', 'Mastodon', 'Bluesky'] },
  { category: 'Live & Gaming', color: '#9146ff', sites: ['Twitch', 'Kick', 'YouTube Live', 'Nimo TV', 'AfreecaTV', 'VK Video', 'BIGO Live'] },
  { category: 'Music', color: '#ff5500', sites: ['SoundCloud', 'Bandcamp', 'Mixcloud', 'Audiomack', 'Jamendo', 'NoiseTrade', 'HearThis.at'] },
  { category: 'News & Media', color: '#ffab40', sites: ['BBC', 'CNN', 'ESPN', 'NBC News', 'ABC News', 'Al Jazeera', 'Bloomberg', 'Sky News', 'France 24', 'DW News'] },
  { category: 'Education', color: '#00e676', sites: ['TED', 'Khan Academy', 'MIT OpenCourseWare', 'National Geographic', 'Discovery', 'PBS'] },
  { category: 'Asian Platforms', color: '#fb7299', sites: ['Bilibili', 'Youku', 'iQIYI', 'Weibo', 'Douyin', 'Niconico', 'AbemaTV', 'Viu', 'WeTV'] },
  { category: 'Other', color: '#888', sites: ['Vevo', 'OK.ru', 'VK', 'Generic M3U8', 'Generic MPEG-DASH', 'Direct MP4/MP3 URLs'] },
]

const ALL_SITES = CATEGORIES.flatMap((c) => c.sites)

export default function SupportedSitesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold">Supported Sites</h1>
        <p className="text-muted">{ALL_SITES.length}+ platforms and growing. Powered by yt-dlp.</p>
      </div>

      <div className="space-y-6">
        {CATEGORIES.map(({ category, color, sites }) => (
          <div key={category} className="rounded-2xl border border-white/8 bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <h2 className="text-sm font-semibold text-primary">{category}</h2>
              <span className="ml-auto rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted ring-1 ring-white/5">
                {sites.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sites.map((s) => (
                <span key={s} className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted ring-1 ring-white/5">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-faint">
        yt-dlp supports 1000+ extractors. Not seeing your site? Try pasting the URL directly — it may still work.
      </p>
    </div>
  )
}
