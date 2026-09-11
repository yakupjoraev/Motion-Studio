import type { Metadata } from 'next'

import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { PlaygroundDictionary } from '../../../src/lib/i18n/playground-surface'
import { setRequestLocale } from '../../../src/lib/i18n/request-locale'

import { PlaygroundClient } from './playground-client'

interface PlaygroundPageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: PlaygroundPageProps): Promise<Metadata> {
  const { locale } = await params
  const { playground } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)

  return { title: playground.metaTitle, description: playground.metaDescription }
}

/**
 * A Server Component, like the studio's: the chrome and the heading are in the HTML the server sends,
 * so the first paint is layout rather than a spinner — UI_GUIDELINES.md § Loading and empty states.
 */
export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const { locale } = await params
  const { playground } = getDictionary(setRequestLocale(locale))

  return (
    <PlaygroundDictionary value={playground}>
      {/*
       * `h-dvh` from `lg` up and not below it: the three-column tool is meant to hold one screen, but
       * a viewport that cannot hold it has to grow instead of dividing what it has. Measured at
       * 390 px before the breakpoint was added: each panel was handed 128 px of a page that did not
       * scroll, so one property of eight was reachable — ADR-395.
       */}
      <main id="main" className="flex min-h-dvh flex-col bg-surface-0 lg:h-dvh">
        <header className="flex shrink-0 items-baseline gap-3 border-border border-b px-4 py-3">
          <h1 className="m-0 font-semibold text-foreground text-md">{playground.heading}</h1>
          <p className="m-0 text-foreground-subtle text-xs">{playground.subtitle}</p>
        </header>
        <div className="min-h-0 flex-1">
          <PlaygroundClient />
        </div>
      </main>
    </PlaygroundDictionary>
  )
}
