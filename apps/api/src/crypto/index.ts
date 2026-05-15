import { createCipheriv, randomBytes } from 'node:crypto'
import { Transform } from 'node:stream'

export function generateKey(): Buffer {
  return randomBytes(32)
}

export function encryptChunk(key: Buffer, plaintext: Buffer): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(encrypted.length, 0)
  return Buffer.concat([lenBuf, iv, tag, encrypted])
}

export function createEncryptStream(key: Buffer): Transform {
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      try {
        this.push(encryptChunk(key, chunk))
        cb()
      } catch (e) {
        cb(e as Error)
      }
    },
  })
}
