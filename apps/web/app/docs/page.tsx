import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocsContent } from '../../src/components/docs/docs-content'
import { DocsPager } from '../../src/components/docs/docs-pager'
import { DocsShell } from '../../src/components/docs/docs-shell'
import { neighboursOf } from '../../src/lib/docs/build-nav'
import { findDoc } from '../../src/lib/docs/read-docs'

export const metadata: Metadata = {
  title: 'Documentation — Motion Studio',
  description:
    'The specification this product was built from: 28 documents, the decisions behind them, and the reading paths through them.',
}

/**
 * `/docs` is `docs/README.md` rendered through the same pipeline as every other page — so the index
 * tables and the reading paths are the committed file, not a second copy of it.
 */
export default function DocsIndexPage() {
  const entry = findDoc('')

  if (entry === undefined) {
    notFound()
  }

  return (
    <DocsShell current="" headings={entry.headings}>
      <article className="max-w-[68ch]">
        <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]">
          The specification
        </p>

        <DocsContent headings={entry.headings} tokens={entry.tokens} />

        <DocsPager {...neighboursOf('')} />
      </article>
    </DocsShell>
  )
}
