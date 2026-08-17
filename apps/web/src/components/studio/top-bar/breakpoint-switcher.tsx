'use client'

import { BREAKPOINTS, CASCADE_ORDER, isBreakpointId } from '@motion-studio/schema'
import { Segmented, type SegmentedOption } from '@motion-studio/ui'

import { useStudioStore } from '../../../store/editor-store'

/** SHORTCUTS.md § Breakpoints: `Mod+1` … `Mod+6`, in this order. */
const OPTIONS: readonly SegmentedOption[] = CASCADE_ORDER.map((id) => ({
  value: id,
  content: id,
  label: `${BREAKPOINTS[id].label} — ${BREAKPOINTS[id].frame} px`,
}))

/**
 * Which breakpoint is being edited, and therefore what an inspector edit writes to —
 * RESPONSIVE_ENGINE.md § Editing semantics. The artboard follows the same value.
 */
export function BreakpointSwitcher() {
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const setBreakpoint = useStudioStore((state) => state.setBreakpoint)

  return (
    <Segmented
      aria-label="Breakpoint"
      onValueChange={(next) => {
        if (isBreakpointId(next)) {
          setBreakpoint(next)
        }
      }}
      options={OPTIONS}
      value={breakpoint}
    />
  )
}
