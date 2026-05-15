/**
 * AES-256-GCM v2 frame format (matches server):
 *   header  = [4-byte BE plaintext-len][12-byte IV][16-byte GCM tag]
 *   body    = [ciphertext]
 *   AAD     = [4-byte BE chunkIndex][1-byte finalFlag]
 *
 * Stream ends only when a final-flagged 0-length terminator chunk decrypts
 * successfully. Any truncation, reorder, or chunk drop fails authentication.
 */

const IV_LEN = 12
const TAG_LEN = 16
const LEN_HDR = 4

async function importKey(keyBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
}

function buildAad(index: number, isFinal: boolean): Uint8Array {
  const aad = new Uint8Array(5)
  new DataView(aad.buffer).setUint32(0, index >>> 0, false)
  aad[4] = isFinal ? 1 : 0
  return aad
}

async function decryptFrame(
  key: CryptoKey,
  iv: Uint8Array,
  tag: Uint8Array,
  ciphertext: Uint8Array,
  index: number,
  isFinal: boolean
): Promise<Uint8Array> {
  // WebCrypto expects the GCM tag appended to ciphertext.
  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: buildAad(index, isFinal) },
    key,
    combined
  )
  return new Uint8Array(plain)
}

export interface DecryptSink {
  write(chunk: Uint8Array): Promise<void> | void
  close(): Promise<void> | void
  abort?(reason?: unknown): Promise<void> | void
}

/**
 * Stream-decrypt the response body into a sink, chunk by chunk.
 *
 * Designed so multi-GB files never accumulate in browser memory — pair with
 * `createFileSink()` which writes directly to disk via the File System Access API.
 *
 * Verifies chunk ordering and a final terminator frame. Throws on any
 * AEAD failure (truncation, drop, reorder, tampering).
 */
export async function decryptStreamTo(
  response: Response,
  keyBase64: string,
  sink: DecryptSink,
  onProgress: (bytes: number) => void
): Promise<void> {
  if (!response.body) throw new Error('Response has no body')
  const key = await importKey(keyBase64)
  const reader = response.body.getReader()
  let ringBuf = new Uint8Array(0)
  let totalDecrypted = 0
  let nextIndex = 0
  let terminated = false

  const append = (chunk: Uint8Array) => {
    const tmp = new Uint8Array(ringBuf.length + chunk.length)
    tmp.set(ringBuf)
    tmp.set(chunk, ringBuf.length)
    ringBuf = tmp
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) append(value)

      while (ringBuf.length >= LEN_HDR) {
        const view = new DataView(ringBuf.buffer, ringBuf.byteOffset)
        const plaintextLen = view.getUint32(0, false)
        const encryptedLen = IV_LEN + TAG_LEN + plaintextLen
        const totalNeeded = LEN_HDR + encryptedLen
        if (ringBuf.length < totalNeeded) break

        const iv = ringBuf.slice(LEN_HDR, LEN_HDR + IV_LEN)
        const tag = ringBuf.slice(LEN_HDR + IV_LEN, LEN_HDR + IV_LEN + TAG_LEN)
        const ciphertext = ringBuf.slice(LEN_HDR + IV_LEN + TAG_LEN, totalNeeded)
        ringBuf = ringBuf.slice(totalNeeded)

        // Try as data chunk first; on failure retry as terminator. We don't
        // know the flag in advance because it lives in the AAD only.
        let plain: Uint8Array | null = null
        try {
          plain = await decryptFrame(key, iv, tag, ciphertext, nextIndex, false)
        } catch {
          try {
            plain = await decryptFrame(key, iv, tag, ciphertext, nextIndex, true)
            terminated = true
          } catch {
            throw new Error('Decryption failed: stream tampered, truncated, or reordered')
          }
        }
        nextIndex++

        if (terminated) {
          if (plain.length !== 0) throw new Error('Decryption failed: bad terminator')
          break
        }

        if (plain.length > 0) {
          await sink.write(plain)
          totalDecrypted += plain.length
          onProgress(totalDecrypted)
        }
      }

      if (terminated) break
      if (done) {
        if (!terminated) throw new Error('Decryption failed: stream ended without terminator')
        break
      }
    }
    await sink.close()
  } catch (e) {
    try { await sink.abort?.(e) } catch {}
    throw e
  }
}

// ─── Sinks ─────────────────────────────────────────────────────────────────

interface FsWritable {
  write(chunk: Uint8Array): Promise<void>
  close(): Promise<void>
  abort?(reason?: unknown): Promise<void>
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (opts: {
    suggestedName: string
    types?: Array<{ description: string; accept: Record<string, string[]> }>
  }) => Promise<{ createWritable: () => Promise<FsWritable> }>
}

/**
 * Prefer File System Access API (Chromium-based browsers) — writes straight
 * to disk so 4K/8K files never touch RAM. Falls back to an in-memory Blob
 * (Firefox/Safari) — works for files small enough to fit in RAM.
 */
export async function createFileSink(filename: string): Promise<DecryptSink & { finalize?: () => Promise<void> }> {
  const w = window as unknown as SaveFilePickerWindow
  if (typeof w.showSaveFilePicker === 'function') {
    const ext = filename.split('.').pop() ?? 'bin'
    const handle = await w.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'Download', accept: { 'application/octet-stream': [`.${ext}`] } }],
    })
    const writable = await handle.createWritable()
    return {
      async write(chunk: Uint8Array) { await writable.write(chunk) },
      async close() { await writable.close() },
      async abort(reason) { try { await writable.abort?.(reason) } catch {} },
    }
  }

  // Memory fallback for Firefox/Safari.
  const parts: Uint8Array[] = []
  return {
    write(chunk: Uint8Array) { parts.push(chunk) },
    async close() {
      const blob = new Blob(parts as BlobPart[])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    },
    abort() { parts.length = 0 },
  }
}

// ─── Back-compat exports (kept so existing call sites still type-check) ────

/** @deprecated use decryptStreamTo + createFileSink (streaming) */
export async function decryptStream(
  response: Response,
  keyBase64: string,
  onProgress: (bytes: number) => void
): Promise<Blob> {
  const parts: Uint8Array[] = []
  await decryptStreamTo(
    response,
    keyBase64,
    {
      write(chunk) { parts.push(chunk) },
      close() {},
    },
    onProgress
  )
  return new Blob(parts as BlobPart[])
}

/** @deprecated use createFileSink */
export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
