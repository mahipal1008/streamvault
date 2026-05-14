import type { FastifyInstance } from 'fastify'

export default async function healthRoute(app: FastifyInstance) {
  app.get('/healthz', async (_req, reply) => {
    return reply.send({ status: 'ok', ts: Date.now() })
  })
}
