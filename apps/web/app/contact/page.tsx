import type { Metadata } from 'next'
import { Bug, Lightbulb, Scale, MessageCircle, ShieldAlert, Github } from 'lucide-react'

export const metadata: Metadata = { title: 'Contact' }

const CHANNELS = [
  {
    icon: Bug,
    title: 'Report a Bug',
    desc: 'Found something broken? Open a GitHub issue with reproduction steps, your browser/OS info, and the URL you were trying to download. The more detail, the faster the fix.',
    color: 'text-[var(--error)]',
    bg: 'bg-[var(--error-bg)]',
  },
  {
    icon: Lightbulb,
    title: 'Feature Request',
    desc: 'Have an idea to make StreamVault better? We welcome feature requests through GitHub issues. Describe the problem you\'re solving, not just the feature you want — that helps us find the best solution.',
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning-bg)]',
  },
  {
    icon: Scale,
    title: 'Legal Inquiry',
    desc: 'If you have a legitimate legal concern regarding content accessible through StreamVault, please open a GitHub issue with the subject "Legal" and provide specific details. We take DMCA and rights-holder concerns seriously.',
    color: 'text-accent',
    bg: 'bg-[var(--accent-subtle)]',
  },
]

export default function ContactPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <MessageCircle className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Get in <span className="gradient-text">Touch</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          StreamVault is a personal project built by privacy advocates.
          Here's how you can reach us.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--warning)]" />
            <div>
              <p className="text-sm font-semibold text-primary">Privacy-First Communication</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Because StreamVault is built around privacy, we don't operate support email
                addresses, live chat, or phone lines — those would require us to collect and
                store your personal information. All communication happens through GitHub,
                where you control your own identity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {CHANNELS.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="card p-6 group">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${bg} transition-transform group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="text-sm font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>

        {/* GitHub CTA */}
        <div className="mt-10 card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-2)]">
            <Github className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-primary">GitHub Issues</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            GitHub Issues is the primary way to report bugs, request features, and ask
            questions. It's public, transparent, and doesn't require sharing your email.
          </p>
          <p className="mt-4 text-xs text-faint">
            We typically respond within 48 hours.
          </p>
        </div>

        {/* Note */}
        <p className="mt-8 text-center text-xs leading-relaxed text-faint">
          StreamVault does not offer direct customer support because there is nothing
          &quot;customer&quot; about you — you&apos;re a person using a free, private tool.
          We respect that.
        </p>
      </section>
    </div>
  )
}
