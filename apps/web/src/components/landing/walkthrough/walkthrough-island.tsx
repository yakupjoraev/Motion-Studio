'use client'

import { useReducedMotion } from '@motion-studio/motion'
import { type ReactNode, Suspense, lazy } from 'react'

import { useIslandMount } from '../use-island-mount'

const Live = lazy(async () => ({ default: (await import('./walkthrough-live')).WalkthroughLive }))

export interface WalkthroughIslandProps {
  /** The before/after pair. The server's version, and the reduced-motion one — they are the same. */
  readonly fallback: ReactNode
  /** Carried into the live variant too, so the two are the same height — ADR-295. */
  readonly note: string
}

/**
 * The one place on this page where reduced motion changes *what is rendered* rather than how fast it
 * moves: a value that scrubs as the page scrolls is the definition of scroll-linked motion, and
 * ACCESSIBILITY.md § Motion says a visitor who asked for less does not get it. They get the pair.
 */
export function WalkthroughIsland({ fallback, note }: WalkthroughIslandProps) {
  const reduced = useReducedMotion()
  const { ref, mounted } = useIslandMount()

  /* Same reason as the hero island: never a frame with nothing in it — ADR-295. */
  return (
    <div ref={ref}>
      {mounted && !reduced ? (
        <Suspense fallback={fallback}>
          <Live note={note} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}
