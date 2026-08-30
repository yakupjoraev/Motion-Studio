import Link from 'next/link'

/**
 * The last screen. No form, no email capture, no "book a demo" — there is nothing to sign up for and
 * pretending otherwise would contradict the sentence directly above it.
 */
export function Cta() {
  return (
    <section className="relative overflow-hidden border-border-subtle border-t" id="start">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(48rem_24rem_at_50%_120%,var(--ms-color-accent-muted),transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full max-w-[76rem] flex-col items-start gap-6 px-5 py-20 sm:px-8 lg:items-center lg:py-28 lg:pl-[7.5rem] lg:text-center">
        <h2 className="max-w-[20ch] text-balance font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Open it. Nothing to install, nothing to sign.
        </h2>

        <p className="max-w-[48ch] text-balance text-foreground-muted text-lg leading-relaxed">
          The studio runs entirely in this browser. Your documents live in IndexedDB and leave as
          files you hold.
        </p>

        <div className="flex flex-wrap items-center gap-3 lg:justify-center">
          <Link
            className="rounded-md bg-accent px-4 py-2.5 font-medium text-foreground-onAccent outline-none transition-colors hover:bg-accent-hover focus-visible:shadow-focus"
            href="/studio"
            prefetch={false}
          >
            Open the studio
          </Link>
          <Link
            className="rounded-md border border-border bg-surface-1 px-4 py-2.5 font-medium outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
            href="/docs"
            prefetch={false}
          >
            Read the docs
          </Link>
        </div>
      </div>
    </section>
  )
}
