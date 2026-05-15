import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { tmpdir } from 'node:os'
import { readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { config } from './config.js'
import metaRoute from './routes/meta.js'
import downloadRoute from './routes/download.js'
import streamRoute from './routes/stream.js'
import progressRoute from './routes/progress.js'
import sitesRoute from './routes/sites.js'
import healthRoute from './routes/health.js'

// Prevent server crashes from uncaught errors
process.on('uncaughtException', (err) => {
  process.stderr.write(`[StreamVault] uncaught: ${err.message}\n`)
})
process.on('unhandledRejection', (err: any) => {
  process.stderr.write(`[StreamVault] rejection: ${err?.message ?? err}\n`)
})

// Clean leftover temp files from previous runs
try {
  const tmp = tmpdir()
  for (const f of readdirSync(tmp)) {
    if (f.startsWith('sv_')) {
      try { unlinkSync(join(tmp, f)) } catch {}
    }
  }
} catch {}

const app = Fastify({
  logger: { level: 'silent' },
  trustProxy: true,
})

await app.register(helmet, {
  contentSecurityPolicy: false,
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
  max: 300,
  timeWindow: '15 minutes',
  keyGenerator: () => 'global',
})

app.register(healthRoute)
app.register(metaRoute, { prefix: '/api' })
app.register(downloadRoute, { prefix: '/api' })
app.register(streamRoute, { prefix: '/api' })
app.register(progressRoute, { prefix: '/api' })
app.register(sitesRoute, { prefix: '/api' })

app.setNotFoundHandler((_req, reply) => {
  reply.status(404).send({ error: 'Not found' })
})

app.setErrorHandler((err, _req, reply) => {
  const status = (err as any).statusCode ?? 500
  reply.status(status).send({ error: err.message })
})

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  process.stdout.write(`StreamVault API running on :${config.PORT}\n`)
} catch {
  process.exit(1)
}
