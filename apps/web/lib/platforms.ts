export const API_BASE = typeof window !== 'undefined' ? '/api' : (process.env.API_URL ?? 'http://localhost:3001') + '/api'

export const PLATFORMS: Record<string, { name: string; color: string }> = {
  'youtube.com': { name: 'YouTube', color: '#ff0000' },
  'youtu.be': { name: 'YouTube', color: '#ff0000' },
  'instagram.com': { name: 'Instagram', color: '#e1306c' },
  'twitter.com': { name: 'Twitter / X', color: '#1da1f2' },
  'x.com': { name: 'X', color: '#ffffff' },
  'tiktok.com': { name: 'TikTok', color: '#69c9d0' },
  'facebook.com': { name: 'Facebook', color: '#1877f2' },
  'reddit.com': { name: 'Reddit', color: '#ff4500' },
  'vimeo.com': { name: 'Vimeo', color: '#1ab7ea' },
  'twitch.tv': { name: 'Twitch', color: '#9146ff' },
  'soundcloud.com': { name: 'SoundCloud', color: '#ff5500' },
  'bilibili.com': { name: 'Bilibili', color: '#fb7299' },
  'dailymotion.com': { name: 'Dailymotion', color: '#0066dc' },
  'rumble.com': { name: 'Rumble', color: '#85c742' },
  'odysee.com': { name: 'Odysee', color: '#e10094' },
  'bandcamp.com': { name: 'Bandcamp', color: '#1da0c3' },
  'pinterest.com': { name: 'Pinterest', color: '#e60023' },
}

export function detectPlatform(url: string): { name: string; color: string } | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    for (const [key, val] of Object.entries(PLATFORMS)) {
      if (host.includes(key)) return val
    }
    return null
  } catch {
    return null
  }
}
