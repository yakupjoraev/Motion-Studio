'use client'

import { PRESETS, type PresetId } from '@motion-studio/theme'
import { Segmented } from '@motion-studio/ui'

/** Five of the ten, chosen so the row shows the range: two studio themes and three that are not. */
export const PREVIEW_THEMES = ['studio-dark', 'studio-light', 'paper', 'brutal', 'nord'] as const

export type PreviewTheme = (typeof PREVIEW_THEMES)[number]

const isTheme = (value: string): value is PreviewTheme =>
  (PREVIEW_THEMES as readonly string[]).includes(value)

const OPTIONS = PREVIEW_THEMES.map((id) => ({
  value: id,
  label: PRESETS[id as PresetId].name,
  content: PRESETS[id as PresetId].name,
}))

export interface ThemeSwitcherProps {
  readonly value: PreviewTheme
  readonly onChange: (next: PreviewTheme) => void
}

/**
 * The theme the preview is rendered in — THEME_ENGINE.md § Scoped themes.
 *
 * It changes a `ThemeScope`'s variables, not the page's, and not the block's props. That is the claim
 * the section makes: a block that reads tokens is a block that themes, and the proof is that
 * switching costs a variable write rather than a remount — `block-preview.tsx` holds the scope and
 * `grab-effect.spec.ts` asserts the DOM node survives the switch.
 *
 * ADR-306 is what makes the claim true of a block's utility *classes* and not only its variables.
 */
export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
  return (
    <Segmented
      aria-label="Preview theme"
      onValueChange={(next) => {
        if (isTheme(next)) {
          onChange(next)
        }
      }}
      options={OPTIONS}
      value={value}
    />
  )
}
