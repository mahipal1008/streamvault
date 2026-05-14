import type { VideoMetadata, DownloadRequest, DownloadResponse } from 'streamvault-shared'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function fetchMeta(url: string): Promise<VideoMetadata> {
  const res = await fetch(`${API_BASE}/api/meta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function startDownload(req: DownloadRequest): Promise<DownloadResponse> {
  const res = await fetch(`${API_BASE}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export function openProgressStream(jobId: string): EventSource {
  return new EventSource(`${API_BASE}/api/progress/${jobId}`)
}
