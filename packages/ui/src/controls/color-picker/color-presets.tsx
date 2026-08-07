import { cn } from '@motion-studio/utils'
import type { ReactElement } from 'react'

import { colorSwatchStyles } from './color-picker.styles'
import { RECENT_LIMIT } from './color-value'

import type { ColorTokenPreset, ColorValue } from './color-picker.types'

export interface ColorPresetsProps {
  readonly tokens: readonly ColorTokenPreset[]
  readonly recent: readonly string[]
  readonly value: ColorValue
  readonly onPick: (value: ColorValue) => void
  readonly disabled: boolean
}

const Swatch = ({
  color,
  label,
  selected,
  disabled,
  onPick,
}: {
  color: string
  label: string
  selected: boolean
  disabled: boolean
  onPick: () => void
}): ReactElement => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={selected}
    disabled={disabled}
    className={cn(colorSwatchStyles({ selected }), 'p-0')}
    onClick={onPick}
  >
    <span className="absolute inset-0 rounded-[1px]" style={{ background: color }} />
  </button>
)

/**
 * The token row and the recent row. A token stores its reference — § ColorPicker: "picking one stores
 * the token reference, not the resolved value, so the colour follows theme changes."
 */
export function ColorPresets({
  tokens,
  recent,
  value,
  onPick,
  disabled,
}: ColorPresetsProps): ReactElement {
  return (
    <>
      {tokens.length === 0 ? null : (
        <div
          className="flex flex-wrap gap-1"
          // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, which this row has no room for.
          role="group"
          aria-label="Theme colours"
        >
          {tokens.map((preset) => (
            <Swatch
              key={preset.token}
              color={preset.value}
              label={preset.label}
              selected={value.kind === 'token' && value.token === preset.token}
              disabled={disabled}
              onPick={() => onPick({ kind: 'token', token: preset.token })}
            />
          ))}
        </div>
      )}

      {recent.length === 0 ? null : (
        <div
          className="flex flex-wrap gap-1"
          // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, which this row has no room for.
          role="group"
          aria-label="Recent colours"
        >
          {recent.slice(0, RECENT_LIMIT).map((color) => (
            <Swatch
              key={color}
              color={color}
              label={color}
              selected={value.kind === 'color' && value.color === color}
              disabled={disabled}
              onPick={() => onPick({ kind: 'color', color })}
            />
          ))}
        </div>
      )}
    </>
  )
}
