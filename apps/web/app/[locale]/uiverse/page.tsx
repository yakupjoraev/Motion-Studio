import { readIndex } from '@motion-studio/uiverse'
import type { Metadata } from 'next'
import Link from 'next/link'

import { LandingNav } from '../../../src/components/landing/landing-nav'
import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../src/lib/i18n/request-locale'

interface UiversePageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: UiversePageProps): Promise<Metadata> {
  const { locale } = await params
  const { uiverse } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)

  return { title: uiverse.metaTitle, description: uiverse.metaDescription }
}

const NUMBER = new Intl.NumberFormat('en-US')

/**
 * `/uiverse` — the imported catalogue's index, one card per category. The counts come from the
 * import's own summary rather than from counting the files at request time: the summary is what the
 * import asserted, and a page that recounts can disagree with the gate that checks it.
 */
export default async function UiversePage({ params }: UiversePageProps) {
  const { locale } = await params
  const { uiverse, nav } = getDictionary(setRequestLocale(locale))
  const index = readIndex()

  return (
    <>
      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        {nav.skipToContent}
      </a>

      <LandingNav />

      <main
        className="mx-auto flex w-full max-w-[76rem] flex-col gap-10 px-5 py-12 sm:px-8"
        id="main"
      >
        <header className="flex flex-col gap-4">
          <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]">
            {uiverse.eyebrow}
          </p>
          <h1 className="max-w-[20ch] text-balance font-display font-semibold text-4xl text-foreground leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            {uiverse.heading}
          </h1>
          <p className="m-0 max-w-[62ch] text-foreground-muted leading-relaxed">
            {uiverse.lede
              .replace('{elements}', NUMBER.format(index.total))
              .replace('{authors}', NUMBER.format(index.authors))}
          </p>
        </header>

        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {index.categories.map((summary) => (
            <li key={summary.category}>
              <Link
                className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface-1 p-4 outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
                href={`/uiverse/${summary.category}`}
              >
                <span className="font-medium text-foreground">{summary.category}</span>
                <span className="font-mono text-2xs text-foreground-muted tabular-nums">
                  {NUMBER.format(summary.elements)} {uiverse.elements} · {summary.authors}{' '}
                  {uiverse.authors}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="m-0 max-w-[62ch] text-foreground-subtle text-xs leading-relaxed">
          {uiverse.licence}
        </p>
      </main>
    </>
  )
}
