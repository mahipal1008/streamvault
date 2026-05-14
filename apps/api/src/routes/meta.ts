import type { FastifyInstance } from 'fastify'
import { getMetadata } from '../ytdlp/index.js'
import { selectLane, recordSuccess, recordFailure, proxyAvailable, getProxyUrl } from '../lanes/index.js'

export default async function metaRoute(app: FastifyInstance) {
  app.post<{ Body: { url: string } }>(
    '/meta',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url'],
          properties: { url: { type: 'string', maxLength: 2048 } },
        },
      },
    },
    async (req, reply) => {
      const { url } = req.body
      const lane = selectLane()
      const proxyUrl = lane === 'proxy' ? getProxyUrl() : undefined
      const t0 = Date.now()

      try {
        const meta = await getMetadata(url, proxyUrl)
        recordSuccess(lane, Date.now() - t0)
        return reply.send({ ...meta, url, lane })
      } catch (e: unknown) {
        recordFailure(lane, Date.now() - t0)
        const err = e as Error & { requiresProxy?: boolean }

        if (err.requiresProxy && proxyAvailable()) {
          const t1 = Date.now()
          try {
            const meta = await getMetadata(url, getProxyUrl())
            recordSuccess('proxy', Date.now() - t1)
            return reply.send({ ...meta, url, lane: 'proxy', requiresProxy: true })
          } catch (e2: unknown) {
            recordFailure('proxy', Date.now() - t1)
            return reply.status(422).send({ error: (e2 as Error).message })
          }
        }

        return reply.status(422).send({ error: err.message })
      }
    }
  )
}
