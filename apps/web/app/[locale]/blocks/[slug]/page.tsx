import { blockDescription, blockName, categoryName, registryCopy } from '@motion-studio/blocks/i18n'
import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, blockId, describeProps } from '@motion-studio/schema'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BlockA11yNotes } from '../../../../src/components/gallery/detail/block-a11y-notes'
import { BlockPropsTable } from '../../../../src/components/gallery/detail/block-props-table'
import { printBlockSource } from '../../../../src/components/gallery/detail/block-source'
import { BlockWorkbench } from '../../../../src/components/gallery/detail/block-workbench'
import { slotFill } from '../../../../src/components/gallery/slot-fill'
import { LandingNav } from '../../../../src/components/landing/landing-nav'
import { getDictionary } from '../../../../src/lib/i18n/dictionary'
import { localeHref } from '../../../../src/lib/i18n/locale-href'
import { DEFAULT_LOCALE, isLocale } from '../../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../../src/lib/i18n/request-locale'
import { GalleryDictionary } from '../../../../src/lib/i18n/surfaces'

export function generateStaticParams(): { slug: string }[] {
  return blockRegistry.list().map((definition) => ({ slug: definition.id }))
}

const find = (slug: string) => blockRegistry.get(blockId(slug))

interface BlockPageProps {
  readonly params: Promise<{ readonly slug: string; readonly locale: string }>
}

export async function generateMetadata({ params }: BlockPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const definition = find(slug)
  const { gallery } = getDictionary(resolved)

  if (definition === undefined) {
    return { title: gallery.detail.notFoundTitle }
  }

  const copy = registryCopy(resolved)

  return {
    title: `${blockName(copy, definition.id, definition.name)} — Motion Studio`,
    description: blockDescription(copy, definition.id, definition.description),
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
export default async function BlockPage({ params }: BlockPageProps) {
  const { slug, locale } = await params
  const resolved = setRequestLocale(locale)
  const definition = find(slug)

  if (definition === undefined) {
    notFound()
  }

  const source = printBlockSource(definition.id, definition.defaults)
  const { gallery, nav } = getDictionary(resolved)
  const copy = registryCopy(resolved)
  const name = blockName(copy, definition.id, definition.name)

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
        className="mx-auto flex w-full max-w-[76rem] flex-col gap-10 px-5 py-8 sm:px-8"
        id="main"
      >
        <header className="flex flex-col gap-3">
          <nav aria-label="Breadcrumb">
            <Link
              className="rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
              href={localeHref(resolved, '/blocks')}
              prefetch={false}
            >
              {gallery.detail.breadcrumb}
            </Link>
          </nav>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-3xl tracking-[-0.02em] sm:text-4xl">{name}</h1>
            <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
              {categoryName(copy, definition.category, BLOCK_CATEGORIES[definition.category])}
            </p>
          </div>

          <p className="max-w-[62ch] text-foreground-muted text-lg leading-relaxed">
            {blockDescription(copy, definition.id, definition.description)}
          </p>
        </header>

        <GalleryDictionary value={gallery}>
          <BlockWorkbench
            category={definition.category}
            defaults={definition.defaults}
            id={definition.id}
            name={name}
            sourceOfDefaults={source}
          >
            {slotFill(definition)}
          </BlockWorkbench>
        </GalleryDictionary>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl tracking-tight">{gallery.detail.propsHeading}</h2>
          <BlockPropsTable copy={gallery.detail} rows={describeProps(definition)} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl tracking-tight">
            {gallery.detail.accessibilityHeading}
          </h2>
          <BlockA11yNotes a11y={definition.a11y} roleLabel={gallery.detail.role} />
        </section>
      </main>
    </>
  )
}
