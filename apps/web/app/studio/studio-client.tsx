'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { CanvasPlaceholder } from '../../src/components/studio/canvas-placeholder'
import { StudioShell } from '../../src/components/studio/studio-shell'
import { loadBlockRegistry } from '../../src/store/block-registry'
import { connectEscapeHatch } from '../../src/store/escape-hatch-bridge'

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
  // ADR-353: the shell paints before the island's chunk lands, and an empty canvas frame in between
  // is the same silence the route-level fallback exists to remove.
  { ssr: false, loading: () => <CanvasPlaceholder /> },
)

export function StudioClient() {
  /*
   * ADR-279. Connected once and never disconnected: navigating to `/playground` unmounts the studio,
   * and a selection that vanished on the way to the tool that writes to it would be no feature.
   */
  useEffect(() => {
    connectEscapeHatch()
  }, [])

  /*
   * The catalogue, on its own chunk — ADR-312. Requested on mount so it is in flight beside the
   * canvas island's chunk rather than after it, and awaited by nothing: every consumer reads a
   * definition when a command runs, a drag starts or a node is selected.
   */
  useEffect(() => {
    void loadBlockRegistry()
  }, [])

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
