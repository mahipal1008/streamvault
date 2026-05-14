import type { LaneType } from 'streamvault-shared'
import { config } from '../config.js'

interface LaneStats {
  requests: number
  failures: number
  totalLatency: number
}

const stats: Record<LaneType, LaneStats> = {
  direct: { requests: 0, failures: 0, totalLatency: 0 },
  proxy: { requests: 0, failures: 0, totalLatency: 0 },
}

function laneScore(lane: LaneType): number {
  const s = stats[lane]
  if (s.requests === 0) return 1
  const sr = 1 - s.failures / s.requests
  const lat = s.totalLatency / s.requests
  return sr / (lat / 1000 + 1)
}

export function selectLane(preferProxy = false): LaneType {
  if (!config.PROXY_URL) return 'direct'
  if (preferProxy) return 'proxy'
  return laneScore('direct') >= laneScore('proxy') ? 'direct' : 'proxy'
}

export function recordSuccess(lane: LaneType, latency: number): void {
  stats[lane].requests++
  stats[lane].totalLatency += latency
}

export function recordFailure(lane: LaneType, latency: number): void {
  stats[lane].requests++
  stats[lane].failures++
  stats[lane].totalLatency += latency
}

export function proxyAvailable(): boolean {
  return !!config.PROXY_URL
}

export function getProxyUrl(): string | undefined {
  return config.PROXY_URL
}
