import type { FastifyInstance } from 'fastify'
import { spawn } from 'node:child_process'

let cachedReady: { ok: boolean; at: number; details: Record<string, boolean> } | null = null
const READY_TTL_MS = 30_000

function check(cmd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const p = spawn(cmd, args, { stdio: 'ignore' })
      const t = setTimeout(() => { p.kill(); resolve(false) }, 3_000)
      p.on('error', () => { clearTimeout(t); resolve(false) })
      p.on('close', (code) => { clearTimeout(t); resolve(code === 0) })
    } catch {
      resolve(false)
    }
  })
}

export default async function healthRoute(app: FastifyInstance) {
  app.get('/livez', async (_req, reply) => reply.send({ status: 'ok', ts: Date.now() }))

  app.get('/readyz', async (_req, reply) => {
    if (cachedReady && Date.now() - cachedReady.at < READY_TTL_MS) {
      return reply.code(cachedReady.ok ? 200 : 503).send(cachedReady)
    }
    const [ytdlp, ffmpeg] = await Promise.all([
      check('yt-dlp', ['--version']),
      check('ffmpeg', ['-version']),
    ])
    const ok = ytdlp && ffmpeg
    cachedReady = { ok, at: Date.now(), details: { ytdlp, ffmpeg } }
    return reply.code(ok ? 200 : 503).send(cachedReady)
  })

  // Back-compat: Render is configured for /healthz
  app.get('/healthz', async (_req, reply) => reply.send({ status: 'ok', ts: Date.now() }))
}
