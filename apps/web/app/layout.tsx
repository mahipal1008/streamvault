import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'StreamVault — Download Anything, Instantly', template: '%s | StreamVault' },
  description: 'Download video, audio, images and documents from 1000+ platforms in ultra-HD up to 8K. Privacy-first, zero data stored, AES-256-GCM encrypted.',
  keywords: ['video downloader', 'youtube downloader', 'audio downloader', 'tiktok downloader', 'instagram downloader', 'privacy', 'secure'],
  robots: 'noindex, nofollow',
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#080808',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`} suppressHydrationWarning>
      <body className="bg-background text-primary antialiased">
        <div className="relative min-h-dvh flex flex-col">
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
            <div className="absolute -top-[30%] left-[10%] h-[700px] w-[700px] rounded-full bg-[#00d4ff08] blur-[180px]" />
            <div className="absolute top-[50%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#00ff8806] blur-[160px]" />
          </div>
          <Nav />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f0f0f0',
            },
          }}
        />
      </body>
    </html>
  )
}
