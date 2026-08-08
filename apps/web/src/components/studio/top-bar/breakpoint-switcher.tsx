'use client'

import { Segmented, type SegmentedOption } from '@motion-studio/ui'

/** SHORTCUTS.md § Breakpoints: `Mod+1` … `Mod+6`, in this order. */
const BREAKPOINTS: readonly SegmentedOption[] = [
  { value: 'base', content: 'base', label: 'Base' },
  { value: 'sm', content: 'sm', label: 'Small' },
  { value: 'md', content: 'md', label: 'Medium' },
  { value: 'lg', content: 'lg', label: 'Large' },
  { value: 'xl', content: 'xl', label: 'Extra large' },
  { value: '2xl', content: '2xl', label: 'Extra extra large' },
]

/** Disabled until the responsive engine can resolve an override (prompt 44). */
export function BreakpointSwitcher() {
  return <Segmented aria-label="Breakpoint" defaultValue="base" disabled options={BREAKPOINTS} />
}
