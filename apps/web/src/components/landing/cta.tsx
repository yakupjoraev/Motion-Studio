import Link from 'next/link'

import { localeHref } from '../../lib/i18n/locale-href'
import { getRequestDictionary, getRequestLocale } from '../../lib/i18n/request-locale'

/**
 * The last screen. No form, no email capture, no "book a demo" — there is nothing to sign up for and
 * pretending otherwise would contradict the sentence directly above it.
 *
 * Centred, which every other band on this page is not: a closing statement is the one place where the
 * message *is* the composition. It sits on the same sheet the first screen is drawn on, so the page
 * ends where it started, and its buttons are the first screen's buttons — one square vermilion fill
 * and one underlined link, because two shapes for one action is how a page stops looking made.
 */
export function Cta() {
  const locale = getRequestLocale()
  const { cta } = getRequestDictionary().landing

  return (
    <section className="ms-sheet relative border-border border-t" id="start">
      <div className="relative mx-auto flex w-full max-w-[84rem] flex-col items-start gap-7 px-5 py-24 sm:px-8 lg:items-center lg:px-12 lg:py-32 lg:text-center">
        <span aria-hidden="true" className="ms-dim w-24" />

        <h2 className="max-w-[20ch] text-balance font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] tracking-[-0.03em]">
          {cta.heading}
        </h2>

        <p className="max-w-[46ch] text-balance text-[var(--ms-l-ink-soft)] text-lg leading-relaxed">
          {cta.body}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-center">
          <Link
            className="bg-[var(--ms-l-accent-strong)] px-6 py-3.5 font-medium text-[var(--ms-l-accent-ink)] text-sm uppercase tracking-[0.1em] outline-none transition-[background-color,transform] duration-[--ms-duration-fast] ease-[--ms-ease-standard] hover:bg-[var(--ms-l-accent)] focus-visible:shadow-focus active:translate-y-px"
            href={localeHref(locale, '/studio')}
            prefetch={false}
          >
            {cta.openStudio}
          </Link>
          <Link
            className="group inline-flex items-center gap-2 border-[var(--ms-l-ink)] border-b pb-0.5 font-medium text-sm outline-none focus-visible:shadow-focus"
            href={localeHref(locale, '/docs')}
            prefetch={false}
          >
            {cta.readDocs}
            <span
              aria-hidden="true"
              className="transition-transform duration-[--ms-duration-fast] ease-[--ms-ease-standard] group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
