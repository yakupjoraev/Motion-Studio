import type { Metadata } from 'next'

import { GalleryGrid } from '../../src/components/gallery/gallery-grid'
import { galleryCounts, galleryIndex } from '../../src/components/gallery/gallery-index'
import { GallerySearch } from '../../src/components/gallery/gallery-search'
import { LandingNav } from '../../src/components/landing/landing-nav'

export const metadata: Metadata = {
  title: 'Blocks — Motion Studio',
  description:
    'Seventy-two production components, each one live on this page. Open any of them, change its props, and take the React it prints.',
}

/**
 * `/blocks` — PRODUCT.md § Surfaces: "browsable registry with live previews", server-rendered with
 * client islands.
 *
 * There are two kinds of JavaScript on this page and no third: the search box, and one preview per
 * card that starts loading half a viewport before the card arrives. The cards themselves, their
 * copy, their tags and their links are HTML.
 */
export default function BlocksPage() {
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
        className="mx-auto flex w-full max-w-[76rem] flex-col gap-10 px-5 py-12 sm:px-8"
        id="main"
      >
        <header className="flex flex-col gap-4">
          <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]">
            The catalogue
          </p>
          <h1 className="max-w-[20ch] text-balance font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Every block, running.
          </h1>
          <p className="max-w-[58ch] text-foreground-muted text-lg leading-relaxed">
            Not a page of screenshots. Each card below is the component itself, rendered by the same
            registry the editor draws from. Open one to change its props and copy the source it
            prints.
          </p>
        </header>

        <GallerySearch counts={galleryCounts()} index={galleryIndex()} />

        <GalleryGrid />
      </main>
    </>
  )
}
