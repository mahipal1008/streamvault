import { zeroize } from '../crypto/index.js'
import { config } from '../config.js'

interface Entry {
  key: Buffer
  expiresAt: number
}

const store = new Map<string, Entry>()

export function setKey(jobId: string, key: Buffer): void {
  store.set(jobId, { key, expiresAt: Date.now() + config.JOB_TTL_MS })
}

export function getKey(jobId: string): Buffer | undefined {
  const e = store.get(jobId)
  if (!e) return undefined
  if (Date.now() > e.expiresAt) {
    deleteKey(jobId)
    return undefined
  }
  return e.key
}

export function deleteKey(jobId: string): void {
  const e = store.get(jobId)
  if (!e) return
  zeroize(e.key)
  store.delete(jobId)
}

setInterval(() => {
  const now = Date.now()
  for (const [id, e] of store) {
    if (now > e.expiresAt) {
      zeroize(e.key)
      store.delete(id)
    }
  }
}, 60_000).unref()
