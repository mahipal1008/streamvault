'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Shield, BookOpen, Menu, X, Download, HelpCircle, Sun, Moon, Monitor, ChevronDown, Info, FileText, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'

const NAV_LINKS = [
  { href: '/browser', label: 'Browser', icon: Globe },
  { href: '/supported-sites', label: 'Platforms', icon: BookOpen },
  { href: '/how-it-works', label: 'How It Works', icon: Info },
  { href: '/security', label: 'Security', icon: Shield },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ]

  const current = options.find(o => o.value === theme) ?? options[2]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-surface text-muted transition-all hover:text-primary hover:border-[var(--border-strong)] hover:shadow-sm"
        aria-label="Toggle theme"
      >
        <current.icon className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-[var(--border)] bg-surface shadow-lg">
            {options.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors',
                  theme === value
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-surface-2 hover:text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-xl" style={{ background: 'var(--nav-bg)' }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20 transition-all group-hover:ring-accent/40 group-hover:shadow-glow">
            <Download className="h-4 w-4 text-accent" />
          </span>
          <span className="gradient-text text-lg font-bold">StreamVault</span>
          <span className="ml-0.5 hidden rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted ring-1 ring-[var(--ring-subtle)] sm:inline">
            beta
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                pathname === href
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-surface hover:text-primary'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-muted transition-all hover:bg-surface hover:text-primary hover:border-[var(--border-strong)] md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-2 backdrop-blur-xl md:hidden" style={{ background: 'var(--nav-bg)' }}>
          <div className="space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  pathname === href ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface hover:text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-2 px-3">
              {[
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
                { href: '/legal', label: 'Legal' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs text-faint transition hover:text-muted"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
