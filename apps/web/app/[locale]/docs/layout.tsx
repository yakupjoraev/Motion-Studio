import Link from 'next/link'
import type { ReactNode } from 'react'

import { DocsSearch } from '../../../src/components/docs/docs-search'
import { LocaleSwitch } from '../../../src/components/nav/locale-switch'
import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { localeHref } from '../../../src/lib/i18n/locale-href'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { DocsDictionary } from '../../../src/lib/i18n/surfaces'

export interface DocsLayoutProps {
  readonly children: ReactNode
  readonly params: Promise<{ readonly locale: string }>
}

/**
 * The chrome that does not depend on which document is open. The sidebar is not here: it carries
 * `aria-current`, which a layout cannot know — ADR-309 has the measurement.
 *
 * The docs' own dictionary is provided here rather than per page, because the search dialog and the
 * table of contents are client components inside this layout, not inside the article.
 */
export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { docs, nav } = getDictionary(resolved)

  return (
    <DocsDictionary value={docs}>
      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        {nav.skipToContent}
      </a>

      <header className="sticky top-0 z-20 border-border-subtle border-b bg-surface-0/80 backdrop-blur-[--ms-blur-md]">
        <nav
          aria-label={nav.main}
          className="mx-auto flex h-14 w-full max-w-[88rem] items-center gap-3 px-4 sm:gap-6 sm:px-8"
        >
          {/* `whitespace-nowrap`: at 320 px the two words wrapped into two lines inside a 56 px bar,
              which reads as a broken header rather than a compact one (ADR-377). */}
          <Link
            className="whitespace-nowrap rounded-sm font-medium text-sm tracking-tight outline-none focus-visible:shadow-focus"
            href={localeHref(resolved, '/')}
          >
            {nav.brand}
          </Link>

          <Link
            className="rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
            href={localeHref(resolved, '/blocks')}
            prefetch={false}
          >
            {nav.blocks}
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitch label={nav.language} />
            <DocsSearch />
          </div>
        </nav>
      </header>

      {children}
    </DocsDictionary>
  )
}
