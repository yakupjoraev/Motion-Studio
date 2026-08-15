'use client'

import { selectors } from '@motion-studio/editor'
import { useReducedMotion } from '@motion-studio/motion'
import { BREAKPOINTS } from '@motion-studio/schema'
import { Separator } from '@motion-studio/ui'
import { useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { FpsMeter } from './fps-meter'

/** "Hero selected", "3 selected", or nothing — the phrasing the canvas announces. */
function describeSelection(count: number, name: string | null): string {
  if (count === 0) {
    return 'No selection'
  }

  return count === 1 ? `${name ?? 'Block'} selected` : `${count} selected`
}

/**
 * § Density scale: 28 px. Everything on it is read from the store, so it reports the document rather
 * than a guess — the node count, the selection, the breakpoint being previewed, and whether motion
 * is frozen (`Mod+P`, ADR-100).
 */
export function StatusBar() {
  const reduced = useReducedMotion()
  const nodeCount = useStudioStore((state) => Object.keys(state.document.nodes).length)
  // Two primitive selectors rather than one joined string: a block's name may contain a space, and
  // a subscription that returned a new array every time would re-render on every store write.
  const selectedCount = useStudioStore((state) => state.selection.ids.length)
  const selectedName = useStudioStore((state) => {
    const [id] = state.selection.ids

    return id === undefined ? null : (state.document.nodes[id]?.name ?? null)
  })
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const motionPaused = useStudioStore((state) => state.viewport.motionPaused)
  const dirty = useStudioStore(selectors.selectDirty)
  const [showFps, setShowFps] = useState(process.env.NODE_ENV === 'development')

  return (
    <footer className="col-span-3 flex h-[28px] items-center gap-2 border-border border-t bg-surface-1 px-3 text-2xs text-foreground-muted">
      <span data-testid="status-nodes">
        {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
      </span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span data-testid="status-selection">{describeSelection(selectedCount, selectedName)}</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span data-testid="status-breakpoint">{BREAKPOINTS[breakpoint].label}</span>
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
      {motionPaused && (
        <>
          <span className="text-warning" data-testid="status-motion">
            Motion paused
          </span>
          <Separator className="h-3" decorative orientation="vertical" />
        </>
      )}
      <span data-testid="status-saved">{dirty ? 'Unsaved changes' : 'Saved'}</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span>Reduced motion: {reduced ? 'on' : 'off'}</span>
    </footer>
  )
}
