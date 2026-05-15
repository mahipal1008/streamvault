import { createCipheriv, randomBytes } from 'node:crypto'
import { Transform } from 'node:stream'

/**
 * AES-256-GCM v2 framing (matches apps/web/lib/crypto.ts):
 *   frame   = [4-byte BE plaintext-len][12-byte IV][16-byte GCM tag][ciphertext]
 *   AAD     = [4-byte BE chunkIndex][1-byte finalFlag]
 *
 * The stream MUST end with a 0-length terminator frame (finalFlag=1) so the
 * client can detect truncation. Any reorder/drop fails GCM authentication.
 */

export function generateKey(): Buffer {
  return randomBytes(32)
}

function buildAad(index: number, isFinal: boolean): Buffer {
  const aad = Buffer.alloc(5)
  aad.writeUInt32BE(index >>> 0, 0)
  aad[4] = isFinal ? 1 : 0
  return aad
}

function buildFrame(key: Buffer, plaintext: Buffer, index: number, isFinal: boolean): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(buildAad(index, isFinal))
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(encrypted.length, 0)
  return Buffer.concat([lenBuf, iv, tag, encrypted])
}

export function encryptChunk(key: Buffer, plaintext: Buffer): Buffer {
  return buildFrame(key, plaintext, 0, false)
}

export function createEncryptStream(key: Buffer): Transform {
  let index = 0
  return new Transform({
    highWaterMark: 512 * 1024,
    transform(chunk: Buffer, _enc, cb) {
      try {
        // Skip empty data chunks — they'd be confused with the terminator.
        if (chunk.length === 0) return cb()
        this.push(buildFrame(key, chunk, index++, false))
        cb()
      } catch (e) {
        cb(e as Error)
      }
    },
    flush(cb) {
      try {
        // Authenticated terminator: zero-length plaintext, finalFlag=1.
        this.push(buildFrame(key, Buffer.alloc(0), index++, true))
        cb()
      } catch (e) {
        cb(e as Error)
      }
    },
  })
}
