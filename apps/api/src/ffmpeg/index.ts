import { createReadStream, existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import type { Readable } from 'node:stream'

export async function streamFile(filePath: string): Promise<Readable> {
  const stream = createReadStream(filePath, { highWaterMark: 512 * 1024 })
  stream.on('end', () => unlink(filePath).catch(() => null))
  stream.on('error', () => unlink(filePath).catch(() => null))
  return stream
}

export async function deleteFile(filePath: string): Promise<void> {
  if (existsSync(filePath)) await unlink(filePath).catch(() => null)
}
