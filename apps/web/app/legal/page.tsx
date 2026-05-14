import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Legal' }

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-primary mb-6">Legal Disclaimer</h1>

      <div className="space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-primary mb-2">Personal Use Only</h2>
          <p>StreamVault is a personal tool intended for downloading content you have the legal right to download — such as your own uploads, content under Creative Commons or other open licenses, or content where the platform explicitly permits downloading.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-primary mb-2">Copyright</h2>
          <p>Downloading copyrighted content without the copyright holder&apos;s permission may violate copyright law in your jurisdiction. You are solely responsible for ensuring your use of this tool complies with applicable laws and the terms of service of the platforms you access.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-primary mb-2">No Warranty</h2>
          <p>This software is provided &ldquo;as is&rdquo; without warranty of any kind. We make no guarantees about availability, accuracy, or fitness for any particular purpose.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-primary mb-2">Privacy</h2>
          <p>We do not collect, store, or share any personal data. See the <a href="/security" className="text-accent hover:underline">Security</a> page for full details.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-primary mb-2">DMCA</h2>
          <p>StreamVault does not host or cache any content. It acts as a client-side tool to interface with publicly available streaming protocols. We are not responsible for the content accessed through this tool.</p>
        </section>
      </div>
    </div>
  )
}
