import type { ColorTokenPreset } from '../color-picker/index'
import type { ValueControlProps } from '../control-row/index'

/**
 * One `box-shadow` layer, in the grammar `packages/tokens` writes its `ShadowSet` strings in — ADR-040.
 * Lengths are pixels, which is the only unit that table uses.
 */
export interface ShadowLayer {
  readonly x: number
  readonly y: number
  readonly blur: number
  readonly spread: number
  readonly color: string
  readonly inset: boolean
}

export interface ShadowFieldProps extends ValueControlProps<readonly ShadowLayer[]> {
  /** `COMPONENT_LIBRARY.md` § Control kinds names this prop. Defaults to six. */
  readonly max?: number | undefined
  readonly tokens?: readonly ColorTokenPreset[] | undefined
}
