import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocsBreadcrumbs } from '../../../src/components/docs/docs-breadcrumbs'
import { DocsContent } from '../../../src/components/docs/docs-content'
import { DocsPager } from '../../../src/components/docs/docs-pager'
import { DocsShell } from '../../../src/components/docs/docs-shell'
import { neighboursOf } from '../../../src/lib/docs/build-nav'
import { plainText } from '../../../src/lib/docs/frontmatter'
import { INDEX_FILE, findDoc, readDocs } from '../../../src/lib/docs/read-docs'

interface PageProps {
  readonly params: Promise<{ readonly slug: readonly string[] }>
}

/**
 * Every document in `docs/`, statically. Adding a file adds a page: the params come from the
 * directory, so nothing else has to be touched — `docs-routes.test.ts` is the check.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return readDocs()
    .filter((entry) => entry.fileName !== INDEX_FILE)
    .map((entry) => ({ slug: [entry.slug] }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const entry = findDoc(slug.join('/'))

  if (entry === undefined) {
    return {}
  }

  return {
    title: `${entry.fileName} — Motion Studio`,
    description: plainText(entry.frontmatter?.summary ?? entry.firstParagraph).slice(0, 200),
  }
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params
  const entry = findDoc(slug.join('/'))

  if (entry === undefined || entry.fileName === INDEX_FILE) {
    notFound()
  }

  return (
    <DocsShell current={entry.slug} headings={entry.headings}>
      <article className="max-w-[68ch]">
        <DocsBreadcrumbs fileName={entry.fileName} group={entry.frontmatter?.group} />

        <div className="mt-4">
          <DocsContent headings={entry.headings} tokens={entry.tokens} />
        </div>

        <DocsPager {...neighboursOf(entry.slug)} />
      </article>
    </DocsShell>
  )
}
