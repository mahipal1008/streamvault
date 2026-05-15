'use client'

import { CheckCircle2, Loader2, Shield, Download, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes, formatSpeed, formatEta } from '@/lib/formatters'

interface Props {
  phase: 'server' | 'decrypt' | 'done'
  serverProgress: number
  decryptProgress: number
  totalBytes: number
  speed: number
  filename: string
  lane: string
}

const LANE_LABELS: Record<string, string> = {
  direct: 'Direct Lane',
  proxy: 'Proxy Lane',
}

export function DownloadProgress({
  phase,
  serverProgress,
  decryptProgress,
  totalBytes,
  speed,
  filename,
  lane,
}: Props) {
  const isDone = phase === 'done'
  const isDecrypt = phase === 'decrypt'
  const displayProgress = phase === 'server' ? serverProgress : decryptProgress
  const label = isDone ? 'Saved to device' : phase === 'decrypt' ? 'Decrypting…' : 'Downloading…'

  return (
    <div className="card p-5 animate-fade_in">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            {isDone ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
            ) : isDecrypt ? (
              <Shield className="h-4 w-4 flex-shrink-0 text-accent animate-pulse" />
            ) : (
              <Loader2 className="h-4 w-4 flex-shrink-0 text-accent animate-spin" />
            )}
            {label}
          </p>
          <p className="mt-0.5 truncate pl-6 text-xs text-muted">{filename}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Zap className="h-3 w-3" />
          {LANE_LABELS[lane] ?? lane}
        </div>
      </div>

      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label={phase === 'server' ? 'Server download progress' : phase === 'decrypt' ? 'Decryption progress' : 'Download complete'}
        aria-valuenow={Math.round(displayProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-live="polite"
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            isDone ? 'bg-success' : 'bg-accent'
          )}
          style={{ width: `${Math.min(displayProgress, 100)}%` }}
        />
        {!isDone && (
          <div className="shimmer-overlay" />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-3">
          <span>{Math.round(displayProgress)}%</span>
          {totalBytes > 0 && <span>{formatBytes(totalBytes)}</span>}
        </div>
        <div className="flex items-center gap-3">
          {speed > 0 && !isDone && <span>{formatSpeed(speed)}</span>}
          {isDone && (
            <span className="flex items-center gap-1 text-success">
              <Download className="h-3 w-3" />
              Complete
            </span>
          )}
        </div>
      </div>

      {!isDone && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={cn('rounded-lg p-2 text-center border transition-all', phase === 'server' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface-2 border-[var(--border)] text-muted')}>
            <p className="text-xs font-medium">1. Server Fetch</p>
            <p className="mt-0.5 font-mono text-xs">{Math.round(serverProgress)}%</p>
          </div>
          <div className={cn('rounded-lg p-2 text-center border transition-all', isDecrypt ? 'bg-accent/10 border-accent/20 text-accent' : isDone ? 'bg-[var(--success-bg)] border-success/20 text-success' : 'bg-surface-2 border-[var(--border)] text-muted')}>
            <p className="text-xs font-medium">2. Decrypt & Save</p>
            <p className="mt-0.5 font-mono text-xs">{Math.round(decryptProgress)}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
