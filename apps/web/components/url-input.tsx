'use client'

import { useState, useRef, useCallback } from 'react'
import { Link as LinkIcon, X, Loader2, Sparkles } from 'lucide-react'
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

  // Auto-analyze: when a valid URL is pasted into the field, kick off analyze
  // immediately so the user doesn't have to click. We debounce slightly to
  // tolerate sites that paste in multiple chunks.
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSubmitted = useRef<string>('')
  const triggerAnalyze = useCallback((raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === lastSubmitted.current || loading || disabled) return
    try { new URL(trimmed) } catch { return }
    lastSubmitted.current = trimmed
    onAnalyze(trimmed)
  }, [loading, disabled, onAnalyze])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.startsWith('http')) {
        const v = text.trim()
        setValue(v)
        // Immediate analyze — no click required
        setTimeout(() => triggerAnalyze(v), 50)
      }
    } catch {}
  }, [triggerAnalyze])

  // Watch for any change that yields a valid URL and auto-analyze with a tiny debounce.
  // This covers paste-via-keyboard, drag-drop, browser-autofill, etc.
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (autoTimer.current) clearTimeout(autoTimer.current)
    if (!v.trim()) return
    autoTimer.current = setTimeout(() => triggerAnalyze(v), 250)
  }

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
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste any video, audio or media URL…"
          aria-label="Video, audio, or media URL"
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
              aria-label="Paste from clipboard"
              className="flex rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted border border-[var(--border)] transition hover:bg-surface-3 hover:text-primary"
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
