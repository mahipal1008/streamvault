'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Shield, Zap, BookOpen, Menu, X, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/supported-sites', label: 'Sites', icon: BookOpen },
  { href: '/security', label: 'Security', icon: Shield },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 ring-1 ring-accent/20">
            <Download className="h-3.5 w-3.5 text-accent" />
          </span>
          <span className="gradient-text font-bold">StreamVault</span>
          <span className="ml-1 hidden rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted ring-1 ring-white/5 sm:inline">beta</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                pathname === href
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-surface hover:text-primary'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <div className="ml-2 h-5 w-px bg-white/10" />
          <div className="ml-2 flex items-center gap-1.5 rounded-md bg-surface px-3 py-1.5 text-sm text-muted ring-1 ring-white/5">
            <Zap className="h-3 w-3 text-accent" />
            Free
          </div>
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-primary md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm',
                pathname === href ? 'text-accent' : 'text-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
