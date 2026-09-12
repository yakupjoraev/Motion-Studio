import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocsContent } from '../../../src/components/docs/docs-content'
import { DocsPager } from '../../../src/components/docs/docs-pager'
import { DocsShell } from '../../../src/components/docs/docs-shell'
import { neighboursOf } from '../../../src/lib/docs/build-nav'
import { findDoc } from '../../../src/lib/docs/read-docs'
import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../src/lib/i18n/request-locale'
import { alternatesFor } from '../../../src/lib/site'

interface DocsIndexPageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: DocsIndexPageProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { docs } = getDictionary(resolved)

  return {
    title: docs.metaTitle,
    description: docs.metaDescription,
    alternates: alternatesFor(resolved, '/docs'),
  }
}

/**
 * `/docs` is `docs/README.md` rendered through the same pipeline as every other page — so the index
 * tables and the reading paths are the committed file, not a second copy of it.
 */
export default async function DocsIndexPage({ params }: DocsIndexPageProps) {
  const { locale } = await params
  const { docs } = getDictionary(setRequestLocale(locale))
  const entry = findDoc('')

  if (entry === undefined) {
    notFound()
  }

  return (
    <DocsShell current="" headings={entry.headings}>
      <article className="max-w-[68ch]">
        <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]">
          {docs.indexEyebrow}
        </p>

        {docs.englishBodies === '' ? null : (
          <p className="mt-3 rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-foreground-muted text-xs">
            {docs.englishBodies}
          </p>
        )}

        <DocsContent headings={entry.headings} tokens={entry.tokens} />

        <DocsPager {...neighboursOf('')} />
      </article>
    </DocsShell>
  )
}
