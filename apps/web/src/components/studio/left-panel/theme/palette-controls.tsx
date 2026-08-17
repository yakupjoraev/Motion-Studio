'use client'

import { NEUTRAL_HUES } from '@motion-studio/theme'
import { ColorField, ControlRow, type SelectOption } from '@motion-studio/ui'

import { ThemeSelectRow } from './theme-select-row'
import { ThemeSliderRow } from './theme-slider-row'
import { useThemeEdit } from './use-theme-edit'

/** The six families of `THEME_ENGINE.md` § ThemeConfig, named as a designer would say them. */
const NEUTRAL_OPTIONS: readonly SelectOption[] = NEUTRAL_HUES.map((hue) => ({
  value: hue,
  label: `${hue.slice(0, 1).toUpperCase()}${hue.slice(1)}`,
}))

/**
 * Accent, neutral, hue shift, saturation — `THEME_ENGINE.md` § Theme builder UI, first block.
 *
 * The accent is the one control whose gesture is continuous without being a slider: the colour area
 * fires per pointer move, and the picker's own commit is what becomes the history entry.
 */
export function PaletteControls() {
  const { config, preview, commit, set } = useThemeEdit()
  const { accent, neutral, accentHueShift, saturation } = config.palette

  return (
    <>
      <ControlRow label="Accent">
        {(slot) => (
          <ColorField
            {...slot}
            label="Accent"
            onChange={(value) => {
              if (value.kind === 'color') {
                preview('palette.accent', value.color)
              }
            }}
            onCommit={(value) => {
              if (value.kind === 'color') {
                commit('palette.accent', value.color)
              }
            }}
            value={{ kind: 'color', color: accent }}
          />
        )}
      </ControlRow>

      <ThemeSelectRow
        label="Neutral"
        onSelect={(value) => set('palette.neutral', value)}
        options={NEUTRAL_OPTIONS}
        value={neutral}
      />

      <ThemeSliderRow
        label="Hue shift"
        max={30}
        min={-30}
        onCommit={(value) => commit('palette.accentHueShift', value)}
        onPreview={(value) => preview('palette.accentHueShift', value)}
        step={1}
        unit="°"
        value={accentHueShift}
      />

      <ThemeSliderRow
        label="Saturation"
        max={1.5}
        min={0.5}
        onCommit={(value) => commit('palette.saturation', value)}
        onPreview={(value) => preview('palette.saturation', value)}
        step={0.05}
        value={saturation}
      />
    </>
  )
}
