import type { Metadata } from 'next'
import { FileText } from 'lucide-react'

export const metadata: Metadata = { title: 'Terms of Service' }

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using StreamVault ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. Your continued use of the Service constitutes acceptance of any modifications to these Terms.`,
  },
  {
    title: '2. Description of Service',
    content: `StreamVault is a privacy-first media download tool that allows users to download publicly accessible media from supported platforms. The Service encrypts all downloads with AES-256-GCM, retains no user data, and requires no account creation. StreamVault acts as a technical intermediary — it does not host, store, or redistribute any media content.`,
  },
  {
    title: '3. User Responsibilities',
    content: `You are solely responsible for your use of the Service. By using StreamVault, you represent and warrant that:

• You will only download content that you have the legal right to access and download.
• You will not use the Service to infringe upon the intellectual property rights of any third party.
• You will comply with all applicable local, national, and international laws and regulations.
• You will not attempt to reverse engineer, exploit, or abuse the Service infrastructure.
• You understand that StreamVault is a tool, and the legality of downloading specific content depends on your jurisdiction and the rights associated with that content.`,
  },
  {
    title: '4. Intellectual Property',
    content: `StreamVault does not claim ownership of any content downloaded through the Service. All media content is owned by its respective rights holders. The StreamVault interface, branding, and codebase are the intellectual property of the StreamVault project. The Service is built on open-source components (yt-dlp, ffmpeg, Next.js, Fastify) which retain their respective licenses.`,
  },
  {
    title: '5. Disclaimer of Warranties',
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

StreamVault does not warrant that:
• The Service will be uninterrupted, secure, or error-free.
• The results obtained from the Service will be accurate or reliable.
• Any specific platform or media source will remain supported.
• Download speeds or quality will meet your expectations.`,
  },
  {
    title: '6. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, STREAMVAULT AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:

• Your use of or inability to use the Service.
• Any unauthorized access to or alteration of your downloads.
• Any third-party content accessed through the Service.
• Any other matter relating to the Service.`,
  },
  {
    title: '7. DMCA and Copyright Claims',
    content: `StreamVault respects the intellectual property rights of others. If you believe that content accessible through the Service infringes your copyright, please note that StreamVault does not host any content — it provides a technical download mechanism for publicly accessible media. Copyright concerns should be directed to the platform hosting the content. For concerns specifically about the StreamVault Service itself, you may open a GitHub issue.`,
  },
  {
    title: '8. Modifications to Terms',
    content: `StreamVault reserves the right to modify these Terms at any time. Changes will be reflected on this page with an updated revision date. Your continued use of the Service after any modifications constitutes acceptance of the revised Terms. It is your responsibility to review these Terms periodically.`,
  },
  {
    title: '9. Termination',
    content: `StreamVault may terminate or suspend access to the Service at any time, without prior notice or liability, for any reason, including but not limited to a breach of these Terms. Since StreamVault collects no user data and requires no account, "termination" refers to restricting access to the Service infrastructure.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed and construed in accordance with applicable laws, without regard to conflict of law provisions. StreamVault is a personal project and does not operate as a registered business entity. Any disputes arising from these Terms or the Service should be resolved through good-faith communication via GitHub issues.`,
  },
]

export default function TermsPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <FileText className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Terms of <span className="gradient-text">Service</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Please read these terms carefully before using StreamVault.
        </p>
        <p className="mt-4 text-xs text-faint">Last updated: January 2025</p>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="space-y-8">
          {SECTIONS.map(({ title, content }) => (
            <div key={title}>
              <h2 className="mb-3 text-lg font-bold text-primary">{title}</h2>
              <div className="text-sm leading-relaxed text-muted whitespace-pre-line">
                {content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm text-muted">
            By using StreamVault, you acknowledge that you have read, understood, and agree
            to be bound by these Terms of Service.
          </p>
          <p className="mt-3 text-xs text-faint">
            Questions about these terms? Open a GitHub issue with the subject &quot;Terms&quot;.
          </p>
        </div>
      </section>
    </div>
  )
}
