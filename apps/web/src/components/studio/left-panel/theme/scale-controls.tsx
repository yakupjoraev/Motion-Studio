'use client'

import type { SegmentedOption } from '@motion-studio/ui'

import { ThemeSegmentedRow } from './theme-segmented-row'
import { useThemeEdit } from './use-theme-edit'

/**
 * Radius, spacing, motion, elevation — `THEME_ENGINE.md` § Theme builder UI, second block. These are
 * the controls the prompt calls the product's most convincing demo: radius 0 to 2 changes the
 * document's character, and it is one variable write away.
 *
 * The values are numbers in the config and strings in a segmented group, so each row states its own
 * parse. The fractions are the glyphs the document's mock-up uses.
 */

const options = (entries: readonly (readonly [number | string, string])[]): SegmentedOption[] =>
  entries.map(([value, label]) => ({ value: String(value), content: label, label }))

const RADIUS = options([
  [0, '0'],
  [0.5, '½'],
  [1, '1'],
  [1.5, '1½'],
  [2, '2'],
])

const SPACING = options([
  [0.875, '⅞'],
  [1, '1'],
  [1.125, '1⅛'],
])

const MOTION = options([
  [0, '0'],
  [0.5, '½'],
  [1, '1'],
  [1.5, '1½'],
])

const ELEVATION = options([
  ['flat', 'Flat'],
  ['soft', 'Soft'],
  ['sharp', 'Sharp'],
  ['glow', 'Glow'],
])

export function ScaleControls() {
  const { config, set } = useThemeEdit()

  return (
    <>
      <ThemeSegmentedRow
        label="Radius"
        onSelect={(value) => set('radiusScale', Number(value))}
        options={RADIUS}
        value={String(config.radiusScale)}
      />

      <ThemeSegmentedRow
        label="Spacing"
        onSelect={(value) => set('spacingScale', Number(value))}
        options={SPACING}
        value={String(config.spacingScale)}
      />

      <ThemeSegmentedRow
        label="Motion"
        onSelect={(value) => set('motionScale', Number(value))}
        options={MOTION}
        value={String(config.motionScale)}
      />

      <ThemeSegmentedRow
        label="Elevation"
        onSelect={(value) => set('elevationStyle', value)}
        options={ELEVATION}
        value={config.elevationStyle}
      />
    </>
  )
}
