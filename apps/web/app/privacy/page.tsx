import type { Metadata } from 'next'
import { ShieldCheck, EyeOff, Cookie, BarChart3, Server, Users, Baby, MessageCircle, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Privacy Policy' }

const NO_COLLECT = [
  'Your name, email, or any personal identifiers',
  'Your IP address (stripped from all internal calls)',
  'URLs you download or analyze',
  'Browser fingerprints or device information',
  'Usage patterns, session duration, or click data',
  'Cookies, localStorage, or any client-side storage',
  'Search queries or navigation history',
]

const SECTIONS = [
  {
    icon: EyeOff,
    title: 'Information We Don\'t Collect',
    content: 'StreamVault was architecturally designed to be unable to collect data. There is no database, no user table, no analytics pipeline, and no logging infrastructure. We don\'t collect what we can\'t store, and we can\'t store what doesn\'t exist.',
    list: true,
  },
  {
    icon: ShieldCheck,
    title: 'How It Works (Technical Privacy)',
    content: 'When you use StreamVault, your download request is processed entirely in server memory. A unique AES-256-GCM encryption key is generated per session and sent to your browser — the server discards it immediately. The downloaded file is encrypted, streamed to your browser, and deleted from server memory. Your browser decrypts the file locally using the Web Crypto API. When you close the tab, the key in JavaScript memory is garbage collected. At no point is any data written to persistent storage.',
  },
  {
    icon: Cookie,
    title: 'No Cookies, No Analytics',
    content: 'StreamVault sets zero cookies. We don\'t use Google Analytics, Mixpanel, Hotjar, Sentry, or any third-party tracking script. There are no pixel trackers, no session replay tools, and no A/B testing frameworks. The only client-side storage used is a theme preference in localStorage (light/dark mode), which contains no identifying information.',
  },
  {
    icon: BarChart3,
    title: 'No Third-Party Services',
    content: 'StreamVault does not integrate with any third-party services that could track you. There are no CDN-hosted fonts (we use self-hosted Geist), no social media widgets, no embedded iframes, and no external API calls from the client. The only outbound connections are server-side calls to media platforms for content extraction.',
  },
  {
    icon: Server,
    title: 'Data Retention',
    content: 'Data retention period: zero. StreamVault has no persistent storage. Job state is held in an in-memory Map that auto-prunes entries after 30 minutes. Downloaded files are written to RAM-backed tmpfs and deleted immediately after streaming to the client. Server logs are not written to disk. When the server restarts, all ephemeral state is permanently destroyed.',
  },
  {
    icon: Users,
    title: 'Your Rights',
    content: 'Under GDPR, CCPA, and similar privacy regulations, you have rights regarding your personal data — including the right to access, correct, delete, and port your data. Since StreamVault collects and stores absolutely no personal data, these rights are inherently satisfied. There is nothing to access, correct, delete, or port. You are, by design, invisible to us.',
  },
  {
    icon: Baby,
    title: 'Children\'s Privacy',
    content: 'StreamVault does not knowingly collect any information from anyone, including children under 13. Since no accounts exist and no data is collected, there is no mechanism by which a child\'s information could be gathered or stored.',
  },
  {
    icon: MessageCircle,
    title: 'Contact About Privacy',
    content: 'If you have questions or concerns about this privacy policy, you may open a GitHub issue. Since we collect no data, there is nothing to request deletion of — but we\'re happy to answer questions about our architecture and privacy practices.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-bg)]">
          <ShieldCheck className="h-7 w-7 text-[var(--success)]" />
        </div>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Privacy <span className="gradient-text">Policy</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          The shortest privacy policy you&apos;ll ever read.
        </p>
        <p className="mt-4 text-xs text-faint">Last updated: January 2025</p>
      </section>

      {/* Core Statement */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-[var(--success)]/20 bg-[var(--success-bg)] p-8 text-center">
          <p className="text-xl font-bold text-[var(--success)] sm:text-2xl">
            We don&apos;t collect any data. Period.
          </p>
          <p className="mt-3 text-sm text-muted">
            No accounts. No cookies. No analytics. No logs. No database.
            StreamVault was designed from the ground up to know nothing about you.
          </p>
        </div>
      </section>

      {/* What We Don't Collect */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="card p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--error-bg)]">
              <EyeOff className="h-4 w-4 text-[var(--error)]" />
            </div>
            <h2 className="text-lg font-bold text-primary">What We Don&apos;t Collect</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            StreamVault was architecturally designed to be unable to collect data. There is no
            database, no user table, no analytics pipeline, and no logging infrastructure.
          </p>
          <div className="space-y-2">
            {NO_COLLECT.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-secondary">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[var(--success)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="space-y-4">
          {SECTIONS.filter((s) => !s.list).map(({ icon: Icon, title, content }) => (
            <div key={title} className="card p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-primary">{title}</h2>
              </div>
              <p className="pl-12 text-sm leading-relaxed text-muted">{content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm text-muted">
            This privacy policy applies to all versions of StreamVault. Since we collect
            no data, this policy is unlikely to change — but we&apos;ll update this page if it does.
          </p>
          <p className="mt-3 text-xs text-faint">
            Questions? Open a GitHub issue with the subject &quot;Privacy&quot;.
          </p>
        </div>
      </section>
    </div>
  )
}
