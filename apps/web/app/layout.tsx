import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://streamvault-web.onrender.com'),
  title: { default: 'StreamVault — Download Anything, Instantly', template: '%s | StreamVault' },
  description: 'Download video, audio, images and documents from 1000+ platforms in ultra-HD up to 8K. Privacy-first, zero data stored, AES-256-GCM encrypted.',
  keywords: ['video downloader', 'youtube downloader', 'audio downloader', 'tiktok downloader', 'instagram downloader', 'privacy', 'secure'],
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'StreamVault — Download Anything, Instantly',
    description: 'Ultra-HD video, audio and documents from 1000+ platforms. Privacy-first, end-to-end encrypted.',
    siteName: 'StreamVault',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamVault — Download Anything, Instantly',
    description: 'Ultra-HD video, audio and documents from 1000+ platforms.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  colorScheme: 'light dark',
}

// Inline script to prevent flash of wrong theme. Default is dark.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('sv-theme');
    var d = (t === 'light') ? 'light' : 'dark';
    document.documentElement.classList.add(d);
  } catch(e){ document.documentElement.classList.add('dark'); }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-primary antialiased transition-colors duration-200">
        <ThemeProvider>
          <div className="relative min-h-dvh flex flex-col">
            {/* Background ambient blobs */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
              <div className="absolute -top-[30%] left-[10%] h-[700px] w-[700px] rounded-full blur-[180px]" style={{ background: 'var(--hero-blob-1)' }} />
              <div className="absolute top-[50%] right-[-10%] h-[500px] w-[500px] rounded-full blur-[160px]" style={{ background: 'var(--hero-blob-2)' }} />
            </div>
            <Nav />
            <main className="relative z-10 flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              className: '!bg-surface !border !border-[var(--border)] !text-primary !shadow-md',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
