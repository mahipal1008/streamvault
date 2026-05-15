import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://streamvault-web.onrender.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    '', 'about', 'how-it-works', 'supported-sites', 'faq',
    'privacy', 'security', 'terms', 'legal', 'contact',
  ]
  return routes.map((r) => ({
    url: `${SITE}/${r}`.replace(/\/$/, ''),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: r === '' ? 1 : 0.6,
  }))
}
