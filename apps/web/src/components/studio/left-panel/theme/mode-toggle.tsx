'use client'

import type { SegmentedOption } from '@motion-studio/ui'

import { useStudio } from '../../../../lib/i18n/studio-surface'

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
export function ModeToggle() {
  const { theme: copy } = useStudio()
  const { config, set } = useThemeEdit()

  const modes: readonly SegmentedOption[] = [
    { value: 'light', content: copy.light, label: copy.lightMode },
    { value: 'dark', content: copy.dark, label: copy.darkMode },
    { value: 'system', content: copy.system, label: copy.followSystem },
  ]

  return (
    <ThemeSegmentedRow
      label={copy.mode}
      onSelect={(value) => set('colorMode', value)}
      options={modes}
      value={config.colorMode}
    />
  )
}
