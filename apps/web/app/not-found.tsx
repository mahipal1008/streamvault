import Link from 'next/link'
import { Download, Globe } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      {/* Large 404 */}
      <h1 className="text-[8rem] font-extrabold leading-none tracking-tighter gradient-text sm:text-[10rem]">
        404
      </h1>

      {/* Heading */}
      <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
        Page Not Found
      </h2>

      {/* Message */}
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      {/* Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:shadow-[var(--shadow-glow)] dark:text-black"
        >
          <Download className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/supported-sites"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 text-sm font-medium text-muted transition hover:text-primary hover:border-[var(--border-strong)]"
        >
          <Globe className="h-4 w-4" />
          Supported Sites
        </Link>
      </div>
    </div>
  )
}
