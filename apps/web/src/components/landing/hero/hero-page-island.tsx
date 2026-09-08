'use client'

import { type ReactNode, Suspense, lazy, useEffect, useState } from 'react'

import { useIslandMount } from '../use-island-mount'

/**
 * `lazy` rather than `next/dynamic`: a dynamic component with `ssr: false` renders `null` while its
 * chunk is in flight, which empties the frame and moves the page under it. `lazy` suspends, so the
 * server-rendered fallback is what fills the gap — ADR-295.
 */
const Interactive = lazy(async () => ({
  default: (await import('./hero-page-preview')).HeroPagePreview,
}))

/** The width the live page is worth loading at. Below it the frame is 350 px wide and the page in it
 * would be a 1280 px layout at 0.27 — a picture of a page, which is the one thing this must not be. */
const WIDE = '(min-width: 64rem)'

export interface HeroPageIslandProps {
  readonly fallback: ReactNode
}

export function HeroPageIsland({ fallback }: HeroPageIslandProps) {
  const { ref, mounted } = useIslandMount(true)
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(WIDE)
    const read = (): void => setWide(query.matches)

    read()
    query.addEventListener('change', read)

    return () => query.removeEventListener('change', read)
  }, [])

  return (
    <div ref={ref}>
      {mounted && wide ? (
        <Suspense fallback={fallback}>
          <Interactive fallback={fallback} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}
