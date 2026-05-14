import type { FastifyInstance } from 'fastify'
import { stat } from 'node:fs/promises'
import { getJob } from '../jobs/registry.js'
import { getKey, deleteKey } from '../jobs/keystore.js'
import { createEncryptStream } from '../crypto/index.js'
import { streamFile } from '../ffmpeg/index.js'

export default async function streamRoute(app: FastifyInstance) {
  app.get<{ Params: { jobId: string } }>('/stream/:jobId', async (req, reply) => {
    const { jobId } = req.params
    const job = getJob(jobId)
    const key = getKey(jobId)

    if (!job || !key) return reply.status(404).send({ error: 'Job not found or expired' })

    const waitDone = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (job.status === 'done') return resolve()
        if (job.status === 'error') return reject(new Error('Download failed on server'))

        const timeout = setTimeout(() => reject(new Error('Timed out waiting for download')), 20 * 60 * 1000)

        job.emitter.once('done', () => { clearTimeout(timeout); resolve() })
        job.emitter.once('error', (d: { error: string }) => { clearTimeout(timeout); reject(new Error(d.error)) })
      })

    try {
      await waitDone()
      const fileStat = await stat(job.outputPath)
      const fileStream = await streamFile(job.outputPath)
      const encStream = createEncryptStream(key)

      reply.raw.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(job.filename)}"`,
        'X-Job-Id': jobId,
        'X-Original-Size': String(fileStat.size),
        'X-Filename': job.filename,
        'X-Encrypted': 'aes-256-gcm',
        'Cache-Control': 'no-store, no-cache',
        'X-Content-Type-Options': 'nosniff',
      })

      fileStream.pipe(encStream).pipe(reply.raw)

      reply.raw.on('close', () => {
        deleteKey(jobId)
        fileStream.destroy()
        encStream.destroy()
      })

      reply.hijack()
    } catch (e: unknown) {
      deleteKey(jobId)
      return reply.status(500).send({ error: (e as Error).message })
    }
  })
}
