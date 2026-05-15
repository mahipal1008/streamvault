import { createCipheriv, randomBytes } from 'node:crypto'
import { Transform } from 'node:stream'

/**
 * Authenticated chunk framing (v2):
 *   [4-byte BE plaintext-len][12-byte IV][16-byte GCM tag][len bytes ciphertext]
 *
 * AAD per chunk = [4-byte BE chunkIndex][1-byte finalFlag].
 * A synthetic 0-length terminator chunk is emitted on flush so the client can
 * detect truncation, reordering, or dropped chunks (all break authentication).
 */

const IV_LEN = 12
const LEN_HDR = 4
const AAD_LEN = 5

export function generateKey(): Buffer {
  return randomBytes(32)
}

export function buildAad(index: number, isFinal: boolean): Buffer {
  const aad = Buffer.allocUnsafe(AAD_LEN)
  aad.writeUInt32BE(index >>> 0, 0)
  aad.writeUInt8(isFinal ? 1 : 0, 4)
  return aad
}

export function encryptChunk(
  key: Buffer,
  plaintext: Buffer,
  index: number,
  isFinal: boolean
): Buffer {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(buildAad(index, isFinal), { plaintextLength: plaintext.length })
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const lenBuf = Buffer.allocUnsafe(LEN_HDR)
  lenBuf.writeUInt32BE(encrypted.length, 0)
  return Buffer.concat([lenBuf, iv, tag, encrypted])
}

export function createEncryptStream(key: Buffer): Transform {
  let index = 0
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      try {
        cb(null, encryptChunk(key, chunk, index++, false))
      } catch (e) {
        cb(e as Error)
      }
    },
    flush(cb) {
      try {
        this.push(encryptChunk(key, Buffer.alloc(0), index++, true))
        cb()
      } catch (e) {
        cb(e as Error)
      }
    },
  })
}

export function zeroize(buf: Buffer): void {
  if (buf && buf.length) buf.fill(0)
}
