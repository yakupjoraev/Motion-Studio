'use client'

import { type ReactNode, Suspense, lazy } from 'react'

import { useIslandMount } from '../use-island-mount'

/**
 * The live grid is a chunk of its own and it arrives when the section does. Six effects on screen at
 * once is the largest concurrent load on this page, and PERFORMANCE.md § Public pages gives `/` 120 kB
 * of first-load JS and a 2.0 s LCP — neither of which a section below the fold may spend.
 */
const Live = lazy(async () => ({ default: (await import('./effect-grid-live')).EffectGridLive }))

export interface EffectGridIslandProps {
  readonly fallback: ReactNode
}

export function EffectGridIsland({ fallback }: EffectGridIslandProps) {
  const { ref, mounted } = useIslandMount()

  return (
    <div ref={ref}>{mounted ? <Suspense fallback={fallback}>{<Live />}</Suspense> : fallback}</div>
  )
}
