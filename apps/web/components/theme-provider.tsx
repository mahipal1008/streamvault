'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(t)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0a0b' : '#ffffff')
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem('sv-theme', t) } catch {}
    applyTheme(t)
  }, [applyTheme])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  useEffect(() => {
    let stored: Theme = 'dark'
    try {
      const raw = localStorage.getItem('sv-theme')
      // Default dark; migrate any prior 'system' or invalid value to 'dark'
      stored = raw === 'light' ? 'light' : 'dark'
    } catch {}
    setThemeState(stored)
    applyTheme(stored)
    setMounted(true)
  }, [applyTheme])

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'dark', resolvedTheme: 'dark', setTheme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
