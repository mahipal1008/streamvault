import { createReadStream, existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import type { Readable } from 'node:stream'

export async function streamFile(filePath: string): Promise<Readable> {
  const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 })
  const cleanup = () => unlink(filePath).catch(() => null)
  stream.on('end', cleanup)
  stream.on('error', cleanup)
  stream.on('close', cleanup)
  return stream
}

export async function deleteFile(filePath: string): Promise<void> {
  if (existsSync(filePath)) await unlink(filePath).catch(() => null)
}
