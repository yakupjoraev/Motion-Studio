'use client'

import type { SegmentedOption } from '@motion-studio/ui'

import { ThemeSegmentedRow } from './theme-segmented-row'
import { useThemeEdit } from './use-theme-edit'

/**
 * Glass, noise, borders — `THEME_ENGINE.md` § Theme builder UI, fourth block.
 *
 * Noise is a segmented group rather than the slider the document's mock-up sketches: `NoiseLevel` is
 * four named steps in `ThemeConfig`, and a slider would offer values the config cannot hold. The
 * levels carry their opacity in the label, which is what the sketched slider was showing.
 */

const GLASS: readonly SegmentedOption[] = [
  { value: 'none', content: 'None', label: 'No glass' },
  { value: 'subtle', content: 'Subtle', label: 'Subtle glass' },
  { value: 'medium', content: 'Medium', label: 'Medium glass' },
  { value: 'strong', content: 'Strong', label: 'Strong glass' },
]

const NOISE: readonly SegmentedOption[] = [
  { value: 'none', content: 'None', label: 'No noise' },
  { value: 'subtle', content: 'Subtle', label: 'Subtle noise' },
  { value: 'light', content: 'Light', label: 'Light noise' },
  { value: 'medium', content: 'Medium', label: 'Medium noise' },
]

const BORDERS: readonly SegmentedOption[] = [
  { value: 'hairline', content: 'Hairline', label: 'Hairline borders' },
  { value: 'solid', content: 'Solid', label: 'Solid borders' },
  { value: 'none', content: 'None', label: 'No borders' },
]

export function SurfaceControls() {
  const { config, set } = useThemeEdit()

  return (
    <>
      <ThemeSegmentedRow
        label="Glass"
        onSelect={(value) => set('surface.glassLevel', value)}
        options={GLASS}
        value={config.surface.glassLevel}
      />

      <ThemeSegmentedRow
        label="Noise"
        onSelect={(value) => set('surface.noiseLevel', value)}
        options={NOISE}
        value={config.surface.noiseLevel}
      />

      <ThemeSegmentedRow
        label="Borders"
        onSelect={(value) => set('surface.borderStyle', value)}
        options={BORDERS}
        value={config.surface.borderStyle}
      />
    </>
  )
}
