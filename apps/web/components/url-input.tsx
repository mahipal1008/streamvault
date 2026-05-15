'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, Link as LinkIcon, X, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { detectPlatform } from '@/lib/platforms'

interface Props {
  onAnalyze: (url: string) => void
  loading: boolean
  disabled?: boolean
}

export function UrlInput({ onAnalyze, loading, disabled }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const platform = value ? detectPlatform(value) : null

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.startsWith('http')) {
        setValue(text.trim())
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } catch {}
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading || disabled) return
    try { new URL(trimmed) } catch { return }
    onAnalyze(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          'relative flex items-center rounded-2xl border bg-surface shadow-sm transition-all duration-200',
          focused ? 'border-accent/50 glow shadow-md' : 'border-[var(--border)]',
          loading && 'opacity-80'
        )}
      >
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center text-muted">
          {platform ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold"
              style={{ background: platform.color + '22', color: platform.color }}
            >
              {platform.name.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste any video, audio or media URL…"
          className="flex-1 bg-transparent py-4 pr-2 text-base text-primary placeholder:text-faint outline-none"
          disabled={loading || disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        <div className="flex items-center gap-2 pr-3">
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {!value && (
            <button
              type="button"
              onClick={handlePaste}
              className="hidden rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted border border-[var(--border)] transition hover:bg-surface-3 hover:text-primary sm:flex"
            >
              Paste
            </button>
          )}

          <button
            type="submit"
            disabled={!value || loading || disabled}
            className={cn(
              'flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200',
              value && !loading && !disabled
                ? 'bg-accent text-white dark:text-black hover:bg-accent-hover hover:shadow-glow-strong hover:scale-[1.02]'
                : 'bg-surface-2 text-muted cursor-not-allowed border border-[var(--border)]'
            )}
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Analyze</>
            )}
          </button>
        </div>
      </div>

      {platform && value && (
        <p className="mt-2 flex items-center gap-1.5 px-2 text-xs text-muted animate-fade_in">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: platform.color }} />
          Detected: {platform.name}
        </p>
      )}
    </form>
  )
}
