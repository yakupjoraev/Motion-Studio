import type { ValueControlProps } from '../control-row/index'

/** CSS shorthand order. `SpacingField` writes and reads it in exactly this sequence. */
export interface SpacingValue {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface SpacingFieldProps extends ValueControlProps<SpacingValue> {
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly step?: number | undefined
  readonly unit?: string | undefined
  /** Starts with the four sides tied together. Link state is UI state and never enters the value. */
  readonly linked?: boolean | undefined
}
