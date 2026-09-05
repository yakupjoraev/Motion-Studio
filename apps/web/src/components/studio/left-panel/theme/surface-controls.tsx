'use client'

import type { SegmentedOption } from '@motion-studio/ui'

import { useStudio } from '../../../../lib/i18n/studio-surface'
import { ThemeSegmentedRow } from './theme-segmented-row'
import { useThemeEdit } from './use-theme-edit'

/**
 * Glass, noise, borders — `THEME_ENGINE.md` § Theme builder UI, fourth block.
 *
 * Noise is a segmented group rather than the slider the document's mock-up sketches: `NoiseLevel` is
 * four named steps in `ThemeConfig`, and a slider would offer values the config cannot hold. The
 * levels carry their opacity in the label, which is what the sketched slider was showing.
 */

export function SurfaceControls() {
  const { theme: copy } = useStudio()
  const { config, set } = useThemeEdit()

  /*
   * Built here rather than at module scope: a step's short word is what the segment shows and its
   * long one is the accessible name, and both are strings the session's language decides.
   */
  const glass: readonly SegmentedOption[] = [
    { value: 'none', content: copy.none, label: copy.noGlass },
    { value: 'subtle', content: copy.subtle, label: copy.subtleGlass },
    { value: 'medium', content: copy.medium, label: copy.mediumGlass },
    { value: 'strong', content: copy.strong, label: copy.strongGlass },
  ]

  const noise: readonly SegmentedOption[] = [
    { value: 'none', content: copy.none, label: copy.noNoise },
    { value: 'subtle', content: copy.subtle, label: copy.subtleNoise },
    { value: 'light', content: copy.lightLevel, label: copy.lightNoise },
    { value: 'medium', content: copy.medium, label: copy.mediumNoise },
  ]

  const borders: readonly SegmentedOption[] = [
    { value: 'hairline', content: copy.hairline, label: copy.hairlineBorders },
    { value: 'solid', content: copy.solid, label: copy.solidBorders },
    { value: 'none', content: copy.none, label: copy.noBorders },
  ]

  return (
    <>
      <ThemeSegmentedRow
        label={copy.glass}
        onSelect={(value) => set('surface.glassLevel', value)}
        options={glass}
        value={config.surface.glassLevel}
      />

      <ThemeSegmentedRow
        label={copy.noise}
        onSelect={(value) => set('surface.noiseLevel', value)}
        options={noise}
        value={config.surface.noiseLevel}
      />

      <ThemeSegmentedRow
        label={copy.borders}
        onSelect={(value) => set('surface.borderStyle', value)}
        options={borders}
        value={config.surface.borderStyle}
      />
    </>
  )
}
