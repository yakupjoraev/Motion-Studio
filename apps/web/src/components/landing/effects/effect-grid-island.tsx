'use client'

import { type ReactNode, Suspense, lazy } from 'react'

import { useIslandMount } from '../use-island-mount'

/**
 * The live band is a chunk of its own and it arrives when the section does. PERFORMANCE.md § Public
 * pages gives `/` 120 kB of first-load JS and a 2.0 s LCP, neither of which a section below the fold
 * may spend. One effect is mounted at a time, which is also why the plate can afford the big values.
 */
const Live = lazy(async () => ({ default: (await import('./effect-grid-live')).EffectGridLive }))

export interface EffectGridIslandProps {
  readonly fallback: ReactNode
}

export function EffectGridIsland({ fallback }: EffectGridIslandProps) {
  const { ref, mounted } = useIslandMount()

  return (
    <div className="min-w-0" ref={ref}>
      {mounted ? <Suspense fallback={fallback}>{<Live />}</Suspense> : fallback}
    </div>
  )
}
