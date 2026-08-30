'use client'

import { type ReactNode, Suspense, lazy } from 'react'

import { useIslandMount } from '../use-island-mount'

/**
 * A mount flag and `lazy`, so the `<h1>` beside it paints with nothing competing for the main thread —
 * the LCP rule in PERFORMANCE.md § Images.
 *
 * `lazy` rather than `next/dynamic`: a dynamic component with `ssr: false` renders `null` while its
 * chunk is in flight, which emptied the frame for 300 ms and moved the page under it. `lazy`
 * suspends, so the `Suspense` fallback below is what fills that gap — ADR-295.
 *
 * `fallback` is the **server-rendered** static demo, passed in as a slot. That is what makes the
 * degraded case real rather than a promise: with JavaScript off, the HTML the server sent is the
 * whole component and it is complete.
 */
const Interactive = lazy(async () => ({ default: (await import('./hero-demo')).HeroDemo }))

export interface HeroDemoIslandProps {
  readonly fallback: ReactNode
}

export function HeroDemoIsland({ fallback }: HeroDemoIslandProps) {
  const { ref, mounted } = useIslandMount(true)

  return (
    <div ref={ref}>
      {mounted ? <Suspense fallback={fallback}>{<Interactive />}</Suspense> : fallback}
    </div>
  )
}
