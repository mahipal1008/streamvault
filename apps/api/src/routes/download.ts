import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
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
      const ext = body.container ?? 'mp4'
      const outputPath = join(tmpdir(), `sv_${jobId}.${ext}`)
      const filename = `download.${ext}`

      const job = createJob({ id: jobId, url: body.url, lane, outputPath, filename })
      setKey(jobId, key)

      const args = buildArgs({
        url: body.url,
        videoFormatId: body.videoFormatId,
        audioTrackIds: body.audioTrackIds ?? [],
        subtitleLangs: body.subtitleLangs ?? [],
        subtitleMode: body.subtitleMode ?? 'soft',
        container: ext,
        outputPath,
        proxyUrl,
      })

      const proc = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] })
      job.status = 'running'
      job.emitter.emit('status', { status: 'running' })

      proc.stdout.on('data', () => {})

      proc.stderr.on('data', (d: Buffer) => {
        const line = d.toString()
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
          job.status = 'done'
          job.progress = 100
          job.emitter.emit('done', {})
        } else {
          job.status = 'error'
          job.emitter.emit('error', { error: 'Download process failed. Try a different format or use proxy lane.' })
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
