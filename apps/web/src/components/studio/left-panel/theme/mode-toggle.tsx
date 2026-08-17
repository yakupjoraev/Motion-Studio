'use client'

import type { SegmentedOption } from '@motion-studio/ui'

import { ThemeSegmentedRow } from './theme-segmented-row'
import { useThemeEdit } from './use-theme-edit'

/**
 * Light, dark, system — `THEME_ENGINE.md` § Colour mode. The mode is a token like any other, so it
 * undoes with the rest of the theme and travels with the document.
 *
 * Worded rather than drawn: the icon set has no sun or moon, and a segmented group needs an accessible
 * name per option anyway. `system` is not a third appearance — it is a subscription to the OS, which
 * `ThemeHost` holds.
 */
const MODES: readonly SegmentedOption[] = [
  { value: 'light', content: 'Light', label: 'Light mode' },
  { value: 'dark', content: 'Dark', label: 'Dark mode' },
  { value: 'system', content: 'System', label: 'Follow the system' },
]

export function ModeToggle() {
  const { config, set } = useThemeEdit()

  return (
    <ThemeSegmentedRow
      label="Mode"
      onSelect={(value) => set('colorMode', value)}
      options={MODES}
      value={config.colorMode}
    />
  )
}
