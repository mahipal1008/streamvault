import type { FastifyInstance } from 'fastify'
import { stat } from 'node:fs/promises'
import { getJob } from '../jobs/registry.js'
import { getKey, deleteKey } from '../jobs/keystore.js'
import { createEncryptStream } from '../crypto/index.js'
import { streamFile } from '../ffmpeg/index.js'
import { config } from '../config.js'

// Track in-flight stream consumers per jobId to enforce a single consumer.
const inflight = new Set<string>()

export default async function streamRoute(app: FastifyInstance) {
  app.head<{ Params: { jobId: string } }>('/stream/:jobId', async (req, reply) => {
    const { jobId } = req.params
    if (!/^[0-9a-f-]{36}$/.test(jobId)) return reply.status(400).send()
    const job = getJob(jobId)
    const key = getKey(jobId)
    if (!job || !key) return reply.status(404).send()
    if (job.status === 'error') return reply.status(500).send()
    if (job.status === 'done') return reply.status(200).send()
    return reply.status(202).send()
  })

  app.get<{ Params: { jobId: string } }>('/stream/:jobId', async (req, reply) => {
    const { jobId } = req.params
    if (!/^[0-9a-f-]{36}$/.test(jobId)) return reply.status(400).send({ error: 'Invalid jobId' })

    const job = getJob(jobId)
    const key = getKey(jobId)
    if (!job || !key) return reply.status(404).send({ error: 'Job not found or expired' })

    if (inflight.has(jobId)) return reply.status(409).send({ error: 'Stream already in progress' })
    inflight.add(jobId)

    const waitDone = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (job.status === 'done') return resolve()
        if (job.status === 'error') return reject(new Error('Download failed on server'))
        const timeout = setTimeout(
          () => reject(new Error('Timed out waiting for download')),
          config.MAX_STREAM_WAIT_MS
        )
        job.emitter.once('done', () => { clearTimeout(timeout); resolve() })
        job.emitter.once('error', (d: { error: string }) => { clearTimeout(timeout); reject(new Error(d.error)) })
      })

    try {
      await waitDone()
      const fileStat = await stat(job.outputPath)
      const fileStream = await streamFile(job.outputPath)
      const encStream = createEncryptStream(key)

      // Validate Origin against allowlist; never echo arbitrary origins.
      const origin = req.headers.origin as string | undefined
      const allowOrigin =
        origin && (config.ALLOWED_ORIGIN === '*' || origin === config.ALLOWED_ORIGIN)
          ? origin
          : config.ALLOWED_ORIGIN === '*'
            ? '*'
            : config.ALLOWED_ORIGIN

      reply.raw.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(job.filename)}"`,
        'X-Job-Id': jobId,
        'X-Original-Size': String(fileStat.size),
        'X-Filename': job.filename,
        'X-Encrypted': 'aes-256-gcm-v2',
        'Cache-Control': 'no-store, no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Expose-Headers':
          'X-Job-Id, X-Original-Size, X-Filename, X-Encrypted, Content-Disposition',
        Vary: 'Origin',
      })

      // Burn the key the instant streaming begins so a parallel consumer cannot replay.
      deleteKey(jobId)

      fileStream.pipe(encStream).pipe(reply.raw)

      const finalize = () => {
        inflight.delete(jobId)
        try { fileStream.destroy() } catch {}
        try { encStream.destroy() } catch {}
      }
      reply.raw.on('close', finalize)
      reply.raw.on('error', finalize)

      reply.hijack()
    } catch (e: unknown) {
      inflight.delete(jobId)
      deleteKey(jobId)
      req.log.warn({ err: (e as Error).message, jobId }, 'stream failed')
      return reply.status(500).send({ error: 'Stream failed' })
    }
  })
}
