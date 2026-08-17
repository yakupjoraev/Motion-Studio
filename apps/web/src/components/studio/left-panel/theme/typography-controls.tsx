'use client'

import { FONT_PAIRING } from '@motion-studio/theme'
import type { SegmentedOption, SelectOption } from '@motion-studio/ui'

import { ThemeSegmentedRow } from './theme-segmented-row'
import { ThemeSelectRow } from './theme-select-row'
import { useThemeEdit } from './use-theme-edit'

/** The pairing reads as the two families it sets, which is how a designer picks one. */
const PAIRINGS: readonly SelectOption[] = Object.entries(FONT_PAIRING).map(([id, pairing]) => ({
  value: id,
  label: `${familyName(pairing.display)} / ${familyName(pairing.mono)}`,
}))

/** A family stack is `"Geist", ui-sans-serif, …`; the pairing's name is its first entry. */
function familyName(stack: string): string {
  const [first = stack] = stack.split(',')

  return first.replaceAll('"', '').trim()
}

const SIZES: readonly SegmentedOption[] = [14, 15, 16].map((size) => ({
  value: String(size),
  content: String(size),
  label: `${size} pixels`,
}))

const RATIOS: readonly SegmentedOption[] = [1.2, 1.25, 1.333].map((ratio) => ({
  value: String(ratio),
  content: String(ratio),
  label: `Ratio ${ratio}`,
}))

/** Font pairing, base size, scale ratio — `THEME_ENGINE.md` § Theme builder UI, third block. */
export function TypographyControls() {
  const { config, set } = useThemeEdit()

  return (
    <>
      <ThemeSelectRow
        label="Font pairing"
        onSelect={(value) => set('typography.pairing', value)}
        options={PAIRINGS}
        value={config.typography.pairing}
      />

      <ThemeSegmentedRow
        label="Base size"
        onSelect={(value) => set('typography.baseSize', Number(value))}
        options={SIZES}
        value={String(config.typography.baseSize)}
      />

      <ThemeSegmentedRow
        label="Scale ratio"
        onSelect={(value) => set('typography.scaleRatio', Number(value))}
        options={RATIOS}
        value={String(config.typography.scaleRatio)}
      />
    </>
  )
}
