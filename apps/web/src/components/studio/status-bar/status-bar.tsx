'use client'

import { Separator } from '@motion-studio/ui'
import { useEffect, useState } from 'react'

import { FpsMeter } from './fps-meter'

/** ANIMATION_SYSTEM.md § Reduced motion: the state the whole studio reads, reported where the user can see it. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const read = (): void => setReduced(query.matches)

    read()
    query.addEventListener('change', read)

    return () => query.removeEventListener('change', read)
  }, [])

  return reduced
}

/**
 * § Density scale: 28 px. It reports what the shell actually knows — the node count and the selection
 * are both zero because no document model exists yet (prompt 12), and saying so is the point of a
 * status bar. The breakpoint and autosave readouts arrive with the things they read.
 */
export function StatusBar() {
  const reduced = useReducedMotion()
  // Dev shows the meter outright; production puts it behind this toggle, per the prompt's § Constraints.
  const [showFps, setShowFps] = useState(process.env.NODE_ENV === 'development')

  return (
    <footer className="col-span-3 flex h-[28px] items-center gap-2 border-border border-t bg-surface-1 px-3 text-2xs text-foreground-muted">
      <span>0 nodes</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span>No selection</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <button
        aria-label="Frame rate meter"
        aria-pressed={showFps}
        className="ms-transition-control rounded-xs px-1 outline-none hover:text-foreground focus-visible:shadow-focus"
        onClick={() => setShowFps((current) => !current)}
        type="button"
      >
        {showFps ? <FpsMeter /> : 'fps'}
      </button>
      <div className="flex-1" />
      <span>Reduced motion: {reduced ? 'on' : 'off'}</span>
    </footer>
  )
}
