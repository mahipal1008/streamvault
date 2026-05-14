import type { FastifyInstance } from 'fastify'
import { getJob } from '../jobs/registry.js'

export default async function progressRoute(app: FastifyInstance) {
  app.get<{ Params: { jobId: string } }>('/progress/:jobId', async (req, reply) => {
    const { jobId } = req.params
    const job = getJob(jobId)

    if (!job) return reply.status(404).send({ error: 'Job not found' })

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    })

    const send = (event: string, data: object) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const onProgress = (d: { progress: number; received: number; speed: number; status: string }) => {
      send('progress', {
        jobId,
        progress: d.progress,
        received: d.received,
        total: job.total,
        speed: d.speed,
        lane: job.lane,
        status: d.status,
      })
    }

    const onDone = () => {
      send('done', { jobId, status: 'done', progress: 100, lane: job.lane })
      reply.raw.end()
    }

    const onError = (d: { error: string }) => {
      send('error', { jobId, status: 'error', error: d.error })
      reply.raw.end()
    }

    const keepalive = setInterval(() => {
      if (!reply.raw.writableEnded) reply.raw.write(': ping\n\n')
    }, 15_000)

    job.emitter.on('progress', onProgress)
    job.emitter.once('done', onDone)
    job.emitter.once('error', onError)

    if (job.status === 'done') { onDone(); clearInterval(keepalive); return }
    if (job.status === 'error') { onError({ error: 'Job already failed' }); clearInterval(keepalive); return }

    req.raw.on('close', () => {
      clearInterval(keepalive)
      job.emitter.off('progress', onProgress)
      job.emitter.off('done', onDone)
      job.emitter.off('error', onError)
    })

    reply.hijack()
  })
}
