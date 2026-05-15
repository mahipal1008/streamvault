import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { config, isProd } from './config.js'
import metaRoute from './routes/meta.js'
import downloadRoute from './routes/download.js'
import streamRoute from './routes/stream.js'
import progressRoute from './routes/progress.js'
import sitesRoute from './routes/sites.js'
import healthRoute from './routes/health.js'

const app = Fastify({
  logger: {
    level: isProd ? 'info' : 'debug',
    redact: {
      paths: ['req.headers.authorization', 'req.headers["x-api-key"]', 'req.headers.cookie', 'req.body.url', 'req.query.url'],
      censor: '[redacted]',
    },
  },
  trustProxy: true,
  bodyLimit: config.BODY_LIMIT_BYTES,
  connectionTimeout: 0,
  keepAliveTimeout: 65_000,
  genReqId: () => globalThis.crypto.randomUUID(),
  disableRequestLogging: false,
})

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (config.ALLOWED_ORIGIN === '*' || origin === config.ALLOWED_ORIGIN) return cb(null, true)
    cb(new Error('CORS: origin not allowed'), false)
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: false,
})

await app.register(rateLimit, {
  global: true,
  max: config.RATE_LIMIT_MAX,
  timeWindow: config.RATE_LIMIT_WINDOW_MS,
  // default keyGenerator uses request.ip (trustProxy honors X-Forwarded-For)
})

// Optional API-key gate. When API_KEY is set, all /api/* routes require X-API-Key.
if (config.API_KEY) {
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/api/')) return
    const supplied = req.headers['x-api-key']
    if (typeof supplied !== 'string' || supplied !== config.API_KEY) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
}

app.register(healthRoute)
app.register(metaRoute, { prefix: '/api' })
app.register(downloadRoute, { prefix: '/api' })
app.register(streamRoute, { prefix: '/api' })
app.register(progressRoute, { prefix: '/api' })
app.register(sitesRoute, { prefix: '/api' })

app.setNotFoundHandler((_req, reply) => {
  reply.status(404).send({ error: 'Not found' })
})

// Map specific status codes through; everything else becomes an opaque 5xx to
// avoid leaking yt-dlp stderr (URLs, paths, proxy strings) to clients.
app.setErrorHandler((err, req, reply) => {
  const status = (err as { statusCode?: number }).statusCode ?? 500
  req.log.error({ err, reqId: req.id }, 'request failed')
  if (status >= 400 && status < 500) {
    return reply.status(status).send({ error: err.message, reqId: req.id })
  }
  return reply.status(500).send({ error: 'Internal server error', reqId: req.id })
})

async function shutdown(signal: string) {
  app.log.info({ signal }, 'shutting down')
  try {
    await app.close()
    process.exit(0)
  } catch (e) {
    app.log.error({ err: e }, 'shutdown failed')
    process.exit(1)
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
} catch (e) {
  app.log.error({ err: e }, 'failed to start')
  process.exit(1)
}
