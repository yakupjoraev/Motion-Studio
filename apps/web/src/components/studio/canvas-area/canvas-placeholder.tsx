'use client'

import { EmptyState, Kbd } from '@motion-studio/ui'

/**
 * The canvas area before there is a canvas. It mounts as a client island because everything that
 * replaces it needs `window` — ARCHITECTURE.md § Rendering strategy — and the shell around it is
 * server-rendered so the first paint is layout rather than a spinner.
 */
export function CanvasPlaceholder() {
  return (
    <div className="grid h-full place-items-center bg-canvas-bg">
      <EmptyState hint={<Kbd keys="Mod+K" />} message="Drag a block to start" />
    </div>
  )
}
