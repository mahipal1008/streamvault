import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync, readdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import type { DownloadRequest, DownloadResponse } from 'streamvault-shared'
import { createJob, getJob, deleteJob } from '../jobs/registry.js'
import { setKey } from '../jobs/keystore.js'
import { generateKey } from '../crypto/index.js'
import { selectLane, getProxyUrl } from '../lanes/index.js'
import { buildArgs } from '../ytdlp/index.js'
import { assertSafeUrl, isSafeYtdlpId, isSafeSubLang } from '../security/url-guard.js'
import { config } from '../config.js'

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

const MAX_AUDIO_TRACKS = 4
const MAX_SUB_LANGS = 8

export default async function downloadRoute(app: FastifyInstance) {
  app.post<{ Body: DownloadRequest }>(
    '/download',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url', 'videoFormatId'],
          additionalProperties: false,
          properties: {
            url: { type: 'string', maxLength: 2048 },
            videoFormatId: { type: 'string', maxLength: 64 },
            audioTrackIds: { type: 'array', items: { type: 'string', maxLength: 64 }, maxItems: MAX_AUDIO_TRACKS },
            subtitleLangs: { type: 'array', items: { type: 'string', maxLength: 12 }, maxItems: MAX_SUB_LANGS },
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

      // Argument validation — block argument-injection and SSRF.
      let safeUrl: string
      try {
        safeUrl = await assertSafeUrl(body.url)
      } catch (e) {
        return reply.status(400).send({ error: (e as Error).message })
      }
      const isSubsOnly = body.videoFormatId === 'subs-only'
      if (!isSubsOnly && !isSafeYtdlpId(body.videoFormatId)) {
        return reply.status(400).send({ error: 'Invalid videoFormatId' })
      }
      const audioTrackIds = (body.audioTrackIds ?? []).filter((id) => isSafeYtdlpId(id))
      if ((body.audioTrackIds ?? []).length !== audioTrackIds.length) {
        return reply.status(400).send({ error: 'Invalid audio track id' })
      }
      const subtitleLangs = (body.subtitleLangs ?? []).filter(isSafeSubLang)
      if ((body.subtitleLangs ?? []).length !== subtitleLangs.length) {
        return reply.status(400).send({ error: 'Invalid subtitle language code' })
      }

      const jobId = randomUUID()
      const key = generateKey()
      const lane = selectLane(body.preferredLane === 'proxy')
      const proxyUrl = lane === 'proxy' ? getProxyUrl() : undefined

      const subFmt = body.subtitleFormat ?? 'srt'
      const subsDir = join(tmpdir(), `sv_subs_${jobId}`)
      const ext = isSubsOnly ? subFmt : (body.container ?? 'mp4')
      const outputPath = isSubsOnly
        ? join(subsDir, `sub.%(ext)s`)
        : join(tmpdir(), `sv_${jobId}.${ext}`)
      const filename = isSubsOnly ? `subtitles.${subFmt}` : `download.${ext}`

      if (isSubsOnly) mkdirSync(subsDir, { recursive: true })

      const job = createJob({ id: jobId, url: safeUrl, lane, outputPath, filename })
      setKey(jobId, key)

      const procRef: { current: ChildProcess | null } = { current: null }

      function spawnYtdlp(useIosFallback: boolean): ChildProcess {
        const spawnArgs = buildArgs({
          url: safeUrl,
          videoFormatId: body.videoFormatId,
          audioTrackIds,
          subtitleLangs,
          subtitleMode: body.subtitleMode ?? 'soft',
          container: ext,
          outputPath,
          proxyUrl,
          useIosFallback,
          subtitleFormat: subFmt,
        })
        return spawn('yt-dlp', spawnArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
      }

      // Hard cap on total job runtime to prevent stuck yt-dlp.
      const killTimer = setTimeout(() => {
        try { procRef.current?.kill('SIGKILL') } catch {}
        job.status = 'error'
        job.emitter.emit('error', { error: 'Download exceeded max duration' })
      }, config.MAX_DOWNLOAD_MS)
      killTimer.unref()

      let stderrBuf = ''
      let lineBuf = ''

      function attachHandlers(proc: ChildProcess) {
        proc.stdout?.on('data', () => {})
        proc.stderr?.on('data', (d: Buffer) => {
          lineBuf += d.toString()
          let idx: number
          while ((idx = lineBuf.indexOf('\n')) !== -1) {
            const line = lineBuf.slice(0, idx)
            lineBuf = lineBuf.slice(idx + 1)
            stderrBuf += line + '\n'
            if (stderrBuf.length > 4000) stderrBuf = stderrBuf.slice(-4000)

            const pm = line.match(PROGRESS_RE)
            if (pm) job.progress = parseFloat(pm[1])
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
          }
        })
      }

      const onClose = (code: number | null, attempt: 'primary' | 'fallback') => {
        if (code === 0) {
          clearTimeout(killTimer)
          if (isSubsOnly) {
            try {
              const files = readdirSync(subsDir).filter((f) => f.endsWith(`.${subFmt}`) || f.endsWith('.srt') || f.endsWith('.vtt'))
              if (files.length > 0) {
                const picked = files[0]
                job.outputPath = join(subsDir, picked)
                job.filename = sanitizeName(picked)
              }
            } catch {}
          }
          job.status = 'done'
          job.progress = 100
          job.emitter.emit('done', {})
          return
        }

        const lastErr = stderrBuf.slice(-600).trim()
        const botDetected = /Sign in to confirm|confirm you.re not a bot|age-restricted/i.test(lastErr)

        if (attempt === 'primary' && botDetected && !proxyUrl && !isSubsOnly) {
          req.log.warn({ jobId }, 'bot-detected, retrying with ios fallback')
          stderrBuf = ''
          lineBuf = ''
          const next = spawnYtdlp(true)
          procRef.current = next
          attachHandlers(next)
          next.on('close', (c2) => onClose(c2, 'fallback'))
          return
        }

        clearTimeout(killTimer)
        job.status = 'error'
        req.log.warn({ jobId, code }, 'yt-dlp exited non-zero')
        const hint = /not available in your country|geo|blocked/i.test(lastErr)
          ? ' (geo-restricted)'
          : botDetected
            ? ' (bot-detected — use proxy lane)'
            : ''
        job.emitter.emit('error', { error: `Download failed${hint}` })
        // best-effort cleanup of partial tmp file
        unlink(outputPath).catch(() => null)
      }

      const first = spawnYtdlp(false)
      procRef.current = first
      job.status = 'running'
      job.emitter.emit('status', { status: 'running' })
      attachHandlers(first)
      first.on('close', (c) => onClose(c, 'primary'))

      job.abort.signal.addEventListener('abort', () => {
        try { procRef.current?.kill('SIGTERM') } catch {}
        clearTimeout(killTimer)
        unlink(outputPath).catch(() => null)
      })

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
    const { jobId } = req.params
    if (!/^[0-9a-f-]{36}$/.test(jobId)) return reply.status(400).send({ error: 'Invalid jobId' })
    const job = getJob(jobId)
    if (!job) return reply.status(404).send({ error: 'Job not found' })
    job.abort.abort()
    deleteJob(jobId)
    return reply.send({ ok: true })
  })
}
