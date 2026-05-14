/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
      keyframes: {
        shimmer: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(200%)' } },
        pulse_dot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        fade_in: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        pulse_dot: 'pulse_dot 2s ease-in-out infinite',
        fade_in: 'fade_in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
