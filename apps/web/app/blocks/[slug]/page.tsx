import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, blockId, describeProps } from '@motion-studio/schema'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BlockA11yNotes } from '../../../src/components/gallery/detail/block-a11y-notes'
import { BlockPropsTable } from '../../../src/components/gallery/detail/block-props-table'
import { printBlockSource } from '../../../src/components/gallery/detail/block-source'
import { BlockWorkbench } from '../../../src/components/gallery/detail/block-workbench'
import { slotFill } from '../../../src/components/gallery/slot-fill'
import { LandingNav } from '../../../src/components/landing/landing-nav'

export function generateStaticParams(): { slug: string }[] {
  return blockRegistry.list().map((definition) => ({ slug: definition.id }))
}

const find = (slug: string) => blockRegistry.get(blockId(slug))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const definition = find(slug)

  if (definition === undefined) {
    return { title: 'Not found — Motion Studio' }
  }

  return {
    title: `${definition.name} — Motion Studio`,
    description: definition.description,
  }
}

/**
 * `/blocks/[slug]` — one block, tunable, with the code it prints.
 *
 * Every one of the seventy-two is a static page: `generateStaticParams` enumerates the registry, and
 * the exporter runs **here**, at build time, so the source in the first screenful is HTML. A visitor
 * who lands, reads the component and copies it has downloaded no exporter and no registry.
 *
 * The props table and the accessibility notes are server-rendered for the same reason and a stronger
 * one — they are documentation, and documentation that needs JavaScript is documentation a search
 * engine and a text browser cannot read.
 */
export default async function BlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const definition = find(slug)

  if (definition === undefined) {
    notFound()
  }

  const source = printBlockSource(definition.id, definition.defaults)

  return (
    <>
      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        Skip to content
      </a>

      <LandingNav />

      <main
        className="mx-auto flex w-full max-w-[76rem] flex-col gap-10 px-5 py-8 sm:px-8"
        id="main"
      >
        <header className="flex flex-col gap-3">
          <nav aria-label="Breadcrumb">
            <Link
              className="rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
              href="/blocks"
              prefetch={false}
            >
              ← All blocks
            </Link>
          </nav>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-3xl tracking-[-0.02em] sm:text-4xl">
              {definition.name}
            </h1>
            <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
              {BLOCK_CATEGORIES[definition.category]}
            </p>
          </div>

          <p className="max-w-[62ch] text-foreground-muted text-lg leading-relaxed">
            {definition.description}
          </p>
        </header>

        <BlockWorkbench
          category={definition.category}
          defaults={definition.defaults}
          id={definition.id}
          name={definition.name}
          sourceOfDefaults={source}
        >
          {slotFill(definition)}
        </BlockWorkbench>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl tracking-tight">Props</h2>
          <BlockPropsTable rows={describeProps(definition)} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl tracking-tight">Accessibility</h2>
          <BlockA11yNotes a11y={definition.a11y} />
        </section>
      </main>
    </>
  )
}
