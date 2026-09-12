import type { Metadata } from 'next'

import { GalleryGrid } from '../../../src/components/gallery/gallery-grid'
import {
  galleryCategoryLabels,
  galleryCounts,
  galleryIndex,
} from '../../../src/components/gallery/gallery-index'
import { GallerySearch } from '../../../src/components/gallery/gallery-search'
import { LandingNav } from '../../../src/components/landing/landing-nav'
import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../src/lib/i18n/request-locale'
import { GalleryDictionary } from '../../../src/lib/i18n/surfaces'
import { alternatesFor } from '../../../src/lib/site'

interface BlocksPageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: BlocksPageProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { gallery } = getDictionary(resolved)

  return {
    title: gallery.metaTitle,
    description: gallery.metaDescription,
    alternates: alternatesFor(resolved, '/blocks'),
  }
}

/**
 * `/blocks` — PRODUCT.md § Surfaces: "browsable registry with live previews", server-rendered with
 * client islands.
 *
 * There are two kinds of JavaScript on this page and no third: the search box, and one preview per
 * card that starts loading half a viewport before the card arrives. The cards themselves, their
 * copy, their tags and their links are HTML.
 */
export default async function BlocksPage({ params }: BlocksPageProps) {
  const { locale } = await params
  const dictionary = getDictionary(setRequestLocale(locale))
  const { gallery, nav } = dictionary

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
            {gallery.eyebrow}
          </p>
          <h1 className="max-w-[20ch] text-balance font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            {gallery.heading}
          </h1>
          <p className="max-w-[58ch] text-foreground-muted text-lg leading-relaxed">
            {gallery.intro}
          </p>
        </header>

        <GalleryDictionary value={gallery}>
          <GallerySearch
            categoryLabels={galleryCategoryLabels()}
            counts={galleryCounts()}
            index={galleryIndex()}
          />
        </GalleryDictionary>

        <GalleryGrid />
      </main>
    </>
  )
}
