'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { StudioShell } from '../../src/components/studio/studio-shell'

/**
 * ARCHITECTURE.md § Rendering strategy: the shell is server-rendered, the canvas is not. It needs
 * `window` from its first effect, so it mounts as its own island — and because it arrives here as a
 * prop, a panel resize cannot render it (ADR-049).
 */
const CanvasIsland = dynamic(
  () =>
    import('../../src/components/studio/canvas-area/canvas-host').then(
      (module) => module.CanvasHost,
    ),
  { ssr: false },
)

export function StudioClient() {
  // `?fixture=` — imported rather than bundled, so the fixture path costs the studio's first load a
  // dynamic import and nothing else.
  useEffect(() => {
    const controller = new AbortController()

    void import('../../src/components/studio/load-fixture').then(({ loadFixtureFromQuery }) => {
      loadFixtureFromQuery(controller.signal)
    })

    return () => {
      controller.abort()
    }
  }, [])

  return <StudioShell canvas={<CanvasIsland />} />
}
