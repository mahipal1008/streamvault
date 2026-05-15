import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { mkdirSync, readdirSync } from 'node:fs'
import type { DownloadRequest, DownloadResponse } from 'streamvault-shared'
import { createJob, getJob } from '../jobs/registry.js'
import { setKey } from '../jobs/keystore.js'
import { generateKey } from '../crypto/index.js'
import { selectLane, getProxyUrl } from '../lanes/index.js'
import { buildArgs } from '../ytdlp/index.js'

const PROGRESS_RE = /(\d+\.?\d*)%/
const SIZE_RE = /(\d+\.?\d*)(KiB|MiB|GiB)\s+at\s+(\d+\.?\d*)(KiB|MiB|GiB)\/s/

function toBytes(val: number, unit: string): number {
  if (unit === 'GiB') return val * 1024 * 1024 * 1024
  if (unit === 'MiB') return val * 1024 * 1024
  return val * 1024
}

function sanitizeName(s: string): string {
  return s.replace(/[^\w\s.-]/g, '').trim().slice(0, 80) || 'download'
}

export default async function downloadRoute(app: FastifyInstance) {
  app.post<{ Body: DownloadRequest }>(
    '/download',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url', 'videoFormatId'],
          properties: {
            url: { type: 'string' },
            videoFormatId: { type: 'string' },
            audioTrackIds: { type: 'array', items: { type: 'string' } },
            subtitleLangs: { type: 'array', items: { type: 'string' } },
            subtitleMode: { type: 'string', enum: ['soft', 'hard', 'sidecar'] },
            container: { type: 'string', enum: ['mkv', 'mp4', 'webm', 'mp3', 'aac', 'flac', 'm4a', 'ogg'] },
            preferredLane: { type: 'string', enum: ['direct', 'proxy'] },
            subtitleFormat: { type: 'string', enum: ['srt', 'vtt'] },
          },
        },
      },
    },
    async (req, reply) => {
      const body = req.body
      const jobId = randomUUID()
      const key = generateKey()
      const lane = selectLane(body.preferredLane === 'proxy')
      const proxyUrl = lane === 'proxy' ? getProxyUrl() : undefined

      const isSubsOnly = body.videoFormatId === 'subs-only'
      const subFmt = body.subtitleFormat ?? 'srt'

      // For subtitle-only: write into a dedicated tmpdir so we can glob the results
      const subsDir = join(tmpdir(), `sv_subs_${jobId}`)
      const ext = isSubsOnly ? subFmt : (body.container ?? 'mp4')
      const outputPath = isSubsOnly
        ? join(subsDir, `sub.%(ext)s`)
        : join(tmpdir(), `sv_${jobId}.${ext}`)
      const filename = isSubsOnly
        ? `subtitles.${subFmt}`
        : `download.${ext}`

      if (isSubsOnly) mkdirSync(subsDir, { recursive: true })

      const job = createJob({ id: jobId, url: body.url, lane, outputPath, filename })
      setKey(jobId, key)

      function spawnYtdlp(useIosFallback = false) {
        const spawnArgs = buildArgs({
          url: body.url,
          videoFormatId: body.videoFormatId,
          audioTrackIds: body.audioTrackIds ?? [],
          subtitleLangs: body.subtitleLangs ?? [],
          subtitleMode: body.subtitleMode ?? 'soft',
          container: ext,
          outputPath,
          proxyUrl,
          useIosFallback,
          subtitleFormat: subFmt,
        })
        return spawn('yt-dlp', spawnArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
      }

      let proc = spawnYtdlp(false)
      job.status = 'running'
      job.emitter.emit('status', { status: 'running' })

      proc.stdout.on('data', () => {})

      let stderrBuf = ''
      proc.stderr.on('data', (d: Buffer) => {
        const line = d.toString()
        stderrBuf += line
        if (stderrBuf.length > 4000) stderrBuf = stderrBuf.slice(-4000)
        const pm = line.match(PROGRESS_RE)
        if (pm) {
          job.progress = parseFloat(pm[1])
        }
        const sm = line.match(SIZE_RE)
        if (sm) {
          job.received = toBytes(parseFloat(sm[1]), sm[2])
          job.speed = toBytes(parseFloat(sm[3]), sm[4])
        }
        const titleMatch = line.match(/\[download\]\s+Destination:\s+(.+)/)
        if (titleMatch) {
          const raw = titleMatch[1].trim().split(/[\\/]/).pop() ?? filename
          job.filename = sanitizeName(raw)
        }
        job.emitter.emit('progress', {
          progress: job.progress,
          received: job.received,
          speed: job.speed,
          status: 'running',
        })
      })

      proc.on('close', (code) => {
        if (code === 0) {
          // For subtitle-only: find the actual output file and update job.outputPath
          if (isSubsOnly) {
            try {
              const files = readdirSync(subsDir).filter(f => f.endsWith(`.${subFmt}`) || f.endsWith('.srt') || f.endsWith('.vtt'))
              if (files.length > 0) {
                const picked = files[0]
                job.outputPath = join(subsDir, picked)
                job.filename = picked
              }
            } catch (_) {}
          }
          job.status = 'done'
          job.progress = 100
          job.emitter.emit('done', {})
        } else {
          const lastErr = stderrBuf.slice(-600).trim()
          const botDetected = lastErr.includes('Sign in') || lastErr.includes('bot') || lastErr.includes('Confirm you')
          // Auto-retry YouTube with ios/android fallback if bot-detected and no proxy
          if (botDetected && !proxyUrl && !isSubsOnly) {
            process.stderr.write(`[StreamVault] bot-detected, retrying with ios fallback | ${body.url}\n`)
            stderrBuf = ''
            proc = spawnYtdlp(true)
            proc.stdout.on('data', () => {})
            proc.stderr.on('data', (d: Buffer) => {
              const l = d.toString()
              stderrBuf += l
              if (stderrBuf.length > 4000) stderrBuf = stderrBuf.slice(-4000)
              const pm2 = l.match(PROGRESS_RE)
              if (pm2) job.progress = parseFloat(pm2[1])
              job.emitter.emit('progress', { progress: job.progress, received: job.received, speed: job.speed, status: 'running' })
            })
            proc.on('close', (code2) => {
              if (code2 === 0) {
                job.status = 'done'; job.progress = 100; job.emitter.emit('done', {})
              } else {
                job.status = 'error'
                const e2 = stderrBuf.slice(-400).trim()
                process.stderr.write(`[StreamVault] ios fallback also failed | ${body.url}\n${e2}\n`)
                job.emitter.emit('error', { error: `Download failed (bot-detected — proxy required): ${e2.slice(-200)}` })
              }
            })
            return
          }
          job.status = 'error'
          process.stderr.write(`[StreamVault] yt-dlp exit ${code} | ${body.url}\n${lastErr}\n`)
          const hint = lastErr.includes('not available in your country') || lastErr.includes('geo') || lastErr.includes('blocked')
            ? ' (geo-restricted)'
            : botDetected ? ' (bot-detected — use proxy lane)' : ''
          job.emitter.emit('error', { error: `Download failed${hint}: ${lastErr.slice(-200)}` })
        }
      })

      job.abort.signal.addEventListener('abort', () => proc.kill('SIGTERM'))

      const res: DownloadResponse = {
        jobId,
        keyBase64: key.toString('base64'),
        filename,
        lane,
      }

      return reply.send(res)
    }
  )

  app.delete<{ Params: { jobId: string } }>('/job/:jobId', async (req, reply) => {
    const job = getJob(req.params.jobId)
    if (!job) return reply.status(404).send({ error: 'Job not found' })
    job.abort.abort()
    return reply.send({ ok: true })
  })
}
