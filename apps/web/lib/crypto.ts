const CHUNK_HEADER = 4 + 12 + 16 // 4-byte len prefix + 12-byte IV + 16-byte GCM tag

async function importKey(keyBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
}

async function decryptChunk(key: CryptoKey, buf: Uint8Array): Promise<Uint8Array> {
  const iv = buf.slice(0, 12)
  const tag = buf.slice(12, 28)
  const ciphertext = buf.slice(28)
  // Auth tag is appended to ciphertext in WebCrypto AES-GCM
  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined)
  return new Uint8Array(plain)
}

export async function decryptStream(
  response: Response,
  keyBase64: string,
  onProgress: (bytes: number) => void
): Promise<Blob> {
  const key = await importKey(keyBase64)
  const reader = response.body!.getReader()
  const chunks: Uint8Array[] = []
  let ringBuf = new Uint8Array(0)
  let totalDecrypted = 0

  const appendRing = (chunk: Uint8Array) => {
    const tmp = new Uint8Array(ringBuf.length + chunk.length)
    tmp.set(ringBuf)
    tmp.set(chunk, ringBuf.length)
    ringBuf = tmp
  }

  while (true) {
    const { done, value } = await reader.read()
    if (value) appendRing(value)
    if (done) break

    while (ringBuf.length >= 4) {
      const view = new DataView(ringBuf.buffer, ringBuf.byteOffset)
      const plaintextLen = view.getUint32(0, false) // big-endian
      const encryptedLen = 12 + 16 + plaintextLen // IV + tag + ciphertext
      const totalNeeded = 4 + encryptedLen

      if (ringBuf.length < totalNeeded) break

      const chunkData = ringBuf.slice(4, 4 + encryptedLen)
      ringBuf = ringBuf.slice(totalNeeded)

      const plain = await decryptChunk(key, chunkData)
      chunks.push(plain)
      totalDecrypted += plain.length
      onProgress(totalDecrypted)
    }
  }

  return new Blob(chunks)
}

export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const ext = filename.split('.').pop() ?? 'bin'
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Download', accept: { 'application/octet-stream': [`.${ext}`] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
