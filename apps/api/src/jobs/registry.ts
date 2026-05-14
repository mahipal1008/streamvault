import { EventEmitter } from 'node:events'
import type { LaneType, JobStatus } from 'streamvault-shared'

export interface Job {
  id: string
  url: string
  status: JobStatus
  lane: LaneType
  progress: number
  received: number
  total: number
  speed: number
  outputPath: string
  filename: string
  emitter: EventEmitter
  abort: AbortController
  startTime: number
}

const jobs = new Map<string, Job>()

export function createJob(opts: {
  id: string
  url: string
  lane: LaneType
  outputPath: string
  filename: string
}): Job {
  const job: Job = {
    id: opts.id,
    url: opts.url,
    status: 'pending',
    lane: opts.lane,
    progress: 0,
    received: 0,
    total: 0,
    speed: 0,
    outputPath: opts.outputPath,
    filename: opts.filename,
    emitter: new EventEmitter(),
    abort: new AbortController(),
    startTime: Date.now(),
  }
  job.emitter.setMaxListeners(20)
  // Critical: prevent uncaught EventEmitter 'error' crash when no client is listening.
  // Explicit listeners added by progress.ts / stream.ts still fire via their own .on/.once registrations.
  job.emitter.on('error', () => {})
  jobs.set(opts.id, job)
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function deleteJob(id: string): void {
  const j = jobs.get(id)
  if (j) {
    j.emitter.removeAllListeners()
    jobs.delete(id)
  }
}

setInterval(() => {
  const ttl = 30 * 60 * 1000
  const now = Date.now()
  for (const [id, job] of jobs) {
    if (now - job.startTime > ttl) deleteJob(id)
  }
}, 5 * 60 * 1000).unref()
