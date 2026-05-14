'use client'

import Image from 'next/image'
import { Play, Eye, Clock, User, Globe, Shield } from 'lucide-react'
import type { VideoMetadata } from 'streamvault-shared'
import { formatDuration, formatBytes } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const LANE_COLORS = {
  direct: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success', label: 'Direct' },
  proxy: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', label: 'Residential Proxy' },
}

interface Props {
  meta: VideoMetadata
  lane: string
  url: string
}

function StatPill({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted ring-1 ring-white/5">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  )
}

export function PreviewCard({ meta, lane, url }: Props) {
  const laneStyle = LANE_COLORS[lane as keyof typeof LANE_COLORS] ?? LANE_COLORS.direct

  return (
    <div className="rounded-2xl border border-white/8 bg-surface overflow-hidden animate-fade_in">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        {meta.thumbnail && (
          <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-48">
            <Image
              src={meta.thumbnail}
              alt={meta.title ?? 'Thumbnail'}
              fill
              className="object-cover"
              unoptimized
            />
            {meta.duration && (
              <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-xs text-white">
                {formatDuration(meta.duration)}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                <Play className="h-4 w-4 text-white" fill="white" />
              </div>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-primary sm:text-base">
              {meta.title ?? 'Untitled'}
            </h2>
            {meta.uploader && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <User className="h-3 w-3" />
                {meta.uploader}
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {meta.viewCount != null && (
              <StatPill icon={Eye} value={Intl.NumberFormat('en', { notation: 'compact' }).format(meta.viewCount)} />
            )}
            {meta.duration && (
              <StatPill icon={Clock} value={formatDuration(meta.duration)} />
            )}
            {meta.platform && (
              <StatPill icon={Globe} value={meta.platform} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', laneStyle.bg, laneStyle.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse_dot', laneStyle.dot)} />
            {laneStyle.label}
          </div>
          <span className="text-xs text-faint">{meta.formats?.length ?? 0} formats available</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Shield className="h-3 w-3 text-accent" />
          <span>AES-256-GCM</span>
        </div>
      </div>
    </div>
  )
}
