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

  // Queue of incoming chunks + a head offset into the first chunk.
  // Avoids the O(N^2) realloc/copy of a single growing ring buffer.
  const queue: Uint8Array[] = []
  let head = 0           // byte offset into queue[0]
  let queued = 0         // total bytes available across the queue

  let totalDecrypted = 0
  let nextIndex = 0
  let terminated = false
  let progressDirty = false
  let lastProgressFlush = 0

  /** Peek `n` bytes WITHOUT consuming — returns a contiguous view (may copy). */
  function peek(n: number): Uint8Array | null {
    if (queued < n) return null
    // Fast path: first chunk already has it contiguous.
    const first = queue[0]
    if (first.length - head >= n) return first.subarray(head, head + n)
    // Slow path: stitch across chunks.
    const out = new Uint8Array(n)
    let written = 0
    let qi = 0
    let off = head
    while (written < n) {
      const c = queue[qi]
      const avail = c.length - off
      const take = Math.min(avail, n - written)
      out.set(c.subarray(off, off + take), written)
      written += take
      if (take === avail) { qi++; off = 0 } else { off += take }
    }
    return out
  }

  /** Drop `n` bytes from the head of the queue. */
  function drop(n: number): void {
    queued -= n
    while (n > 0) {
      const c = queue[0]
      const avail = c.length - head
      if (n < avail) { head += n; return }
      n -= avail
      queue.shift()
      head = 0
    }
  }

  function push(chunk: Uint8Array): void {
    if (chunk.length === 0) return
    queue.push(chunk)
    queued += chunk.length
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) push(value)

      while (queued >= LEN_HDR) {
        const header = peek(LEN_HDR)!
        const view = new DataView(header.buffer, header.byteOffset, LEN_HDR)
        const plaintextLen = view.getUint32(0, false)
        const totalNeeded = LEN_HDR + IV_LEN + TAG_LEN + plaintextLen
        if (queued < totalNeeded) break

        // Materialise the frame body contiguously (peek+drop).
        const frame = peek(totalNeeded)!
        const iv = frame.subarray(LEN_HDR, LEN_HDR + IV_LEN)
        const tag = frame.subarray(LEN_HDR + IV_LEN, LEN_HDR + IV_LEN + TAG_LEN)
        const ciphertext = frame.subarray(LEN_HDR + IV_LEN + TAG_LEN, totalNeeded)
        drop(totalNeeded)

        // FAST PATH: plaintextLen === 0 is the authenticated terminator. The
        // server only emits zero-length frames as the terminator (data chunks
        // of size 0 are skipped). No try/catch fallback needed.
        const isFinal = plaintextLen === 0
        const plain = await decryptFrame(key, iv, tag, ciphertext, nextIndex, isFinal)
        nextIndex++

        if (isFinal) {
          terminated = true
          break
        }

        await sink.write(plain)
        totalDecrypted += plain.length

        // Throttle progress callbacks to ~30Hz so React state updates don't
        // dominate the main thread when decrypting at hundreds of MB/s.
        progressDirty = true
        const now = performance.now()
        if (now - lastProgressFlush >= 33) {
          lastProgressFlush = now
          progressDirty = false
          onProgress(totalDecrypted)
        }
      }

      if (terminated) break
      if (done) {
        if (!terminated) throw new Error('Decryption failed: stream ended without terminator')
        break
      }
    }
    if (progressDirty) onProgress(totalDecrypted)
    await sink.close()
  } catch (e) {
    // Surface authentication failure with the v2 wording the UI expects.
    const msg = (e as Error).message
    if (msg && /OperationError|cipher|gcm|tag/i.test(msg)) {
      const tampered = new Error('Decryption failed: stream tampered, truncated, or reordered')
      try { await sink.abort?.(tampered) } catch {}
      throw tampered
    }
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
