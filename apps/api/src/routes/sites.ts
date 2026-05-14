import type { FastifyInstance } from 'fastify'

const SITES = [
  { category: 'Video', sites: ['YouTube', 'Vimeo', 'Dailymotion', 'Rumble', 'Odysee', 'Bitchute', 'PeerTube', 'Metacafe', 'Veoh', 'Streamable', 'Coub', 'Gfycat', 'Imgur'] },
  { category: 'Social Media', sites: ['Instagram', 'Twitter / X', 'TikTok', 'Facebook', 'Reddit', 'LinkedIn', 'Pinterest', 'Snapchat', 'Telegram (public)', 'Mastodon', 'Bluesky'] },
  { category: 'Live & Gaming', sites: ['Twitch (clips & VODs)', 'Kick', 'YouTube Live', 'Nimo TV', 'AfreecaTV', 'VK Video', 'BIGO Live'] },
  { category: 'Music', sites: ['SoundCloud', 'Bandcamp', 'Mixcloud', 'Audiomack', 'Jamendo', 'NoiseTrade', 'HearThis.at', 'Musescore'] },
  { category: 'News & Media', sites: ['BBC', 'CNN', 'ESPN', 'NBC News', 'ABC News', 'Al Jazeera', 'Bloomberg', 'Sky News', 'France 24', 'DW News', 'RT (Russian TV)', 'CNBC'] },
  { category: 'Education', sites: ['TED', 'Khan Academy', 'Coursera (free content)', 'MIT OpenCourseWare', 'National Geographic', 'Discovery', 'PBS', 'Smithsonian'] },
  { category: 'Asian Platforms', sites: ['Bilibili', 'Youku', 'iQIYI', 'Weibo', 'Douyin', 'Niconico', 'AbemaTV', 'Tver', 'GYAO', 'Viu', 'WeTV'] },
  { category: 'Streaming (free/clips)', sites: ['Hotstar (free)', 'Zee5 (free)', 'MX Player', 'Pluto TV', 'Tubi', 'Crunchyroll (free)', 'Funimation (free)', 'Peacock (free)'] },
  { category: 'Podcasts & Audio', sites: ['Podbean', 'Libsyn', 'Buzzsprout', 'Spreaker', 'Anchor (Spotify)', 'Transistor', 'SimpleCast', 'Whooshkaa'] },
  { category: 'Other', sites: ['Vevo', 'Yahoo Video', 'Liveleak (archive)', 'Myspace Videos', 'Flickr Video', 'Tumblr Video', 'VK', 'OK.ru', 'Xhamster (creative commons)', 'Generic M3U8', 'Generic MPEG-DASH', 'Direct MP4/MP3/WEBM URLs'] },
]

export default async function sitesRoute(app: FastifyInstance) {
  app.get('/sites', async (_req, reply) => {
    return reply.send({ categories: SITES, total: SITES.flatMap((c) => c.sites).length })
  })
}
