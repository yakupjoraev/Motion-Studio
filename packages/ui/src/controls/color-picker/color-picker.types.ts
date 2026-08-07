import type { ValueControlProps } from '../control-row/index'

/**
 * ADR-039. A token reference follows the theme; a literal is an `oklch()` string, which is the form
 * every colour in `packages/tokens` is written in.
 */
export type ColorValue =
  | { readonly kind: 'token'; readonly token: string }
  | { readonly kind: 'color'; readonly color: string }

export interface ColorTokenPreset {
  /** What gets stored when this preset is picked. */
  readonly token: string
  readonly label: string
  /** What the token resolves to right now — for the swatch and the contrast readout only. */
  readonly value: string
}

export interface ColorPickerProps extends ValueControlProps<ColorValue> {
  /** Presets § ColorPicker calls the token row. Picking one stores the reference, not the colour. */
  readonly tokens?: readonly ColorTokenPreset[] | undefined
  readonly alpha?: boolean | undefined
  /** The resolved parent background the contrast readout measures against. */
  readonly background?: string | undefined
  /** Consumer-owned, capped at twelve. The picker renders them and stores nothing. */
  readonly recent?: readonly string[] | undefined
}
