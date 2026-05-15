import type { VideoMetadata, DownloadRequest, DownloadResponse } from 'streamvault-shared'

// NEXT_PUBLIC_API_URL is inlined at build time. We allow it to be unset for
// local builds, but at runtime in the browser in production we refuse to
// silently fall back to localhost.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL
export const API_BASE = rawApiUrl ?? 'http://localhost:3001'

function assertConfigured(): void {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'production') return
  if (!rawApiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured for this deployment')
  }
}

async function parseErr(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (body && typeof body.error === 'string') return body.error
  } catch {}
  return `HTTP ${res.status}`
}

export async function fetchMeta(url: string): Promise<VideoMetadata> {
  assertConfigured()
  const res = await fetch(`${API_BASE}/api/meta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error(await parseErr(res))
  return res.json()
}

export async function startDownload(req: DownloadRequest): Promise<DownloadResponse> {
  assertConfigured()
  const res = await fetch(`${API_BASE}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(await parseErr(res))
  return res.json()
}

export function openProgressStream(jobId: string): EventSource {
  assertConfigured()
  return new EventSource(`${API_BASE}/api/progress/${jobId}`)
}

// Pre-warm the API to eliminate Render free-tier cold-start latency. Fire-and-forget.
// Safe to call multiple times — /api/health is cheap and idempotent.
let prewarmed = false
export function prewarmApi(): void {
  if (prewarmed || typeof window === 'undefined') return
  prewarmed = true
  fetch(`${API_BASE}/api/health`, { method: 'GET', cache: 'no-store', keepalive: true }).catch(() => {
    // Allow retry on next call if this one failed (e.g. network blip during page load)
    prewarmed = false
  })
}
