import type { FastifyInstance } from 'fastify'
import { getMetadata } from '../ytdlp/index.js'
import { selectLane, recordSuccess, recordFailure, proxyAvailable, getProxyUrl } from '../lanes/index.js'
import { assertSafeUrl } from '../security/url-guard.js'

export default async function metaRoute(app: FastifyInstance) {
  app.post<{ Body: { url: string } }>(
    '/meta',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url'],
          properties: { url: { type: 'string', maxLength: 2048 } },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      let url: string
      try {
        url = await assertSafeUrl(req.body.url)
      } catch (e) {
        return reply.status(400).send({ error: (e as Error).message })
      }

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
        req.log.warn({ err: err.message, host: new URL(url).host }, 'meta failed')

        if (err.requiresProxy && proxyAvailable()) {
          const t1 = Date.now()
          try {
            const meta = await getMetadata(url, getProxyUrl())
            recordSuccess('proxy', Date.now() - t1)
            return reply.send({ ...meta, url, lane: 'proxy', requiresProxy: true })
          } catch (e2: unknown) {
            recordFailure('proxy', Date.now() - t1)
            req.log.warn({ err: (e2 as Error).message }, 'meta proxy retry failed')
            return reply.status(422).send({ error: 'Unable to extract metadata via proxy lane' })
          }
        }

        return reply.status(422).send({
          error: err.requiresProxy
            ? 'Content is geo-restricted or bot-protected — try the proxy lane'
            : 'Unable to extract metadata for this URL',
        })
      }
    }
  )
}
