import type { ValueControlProps } from '../control-row/index'

/** CSS `border-radius` shorthand order. */
export interface RadiusValue {
  readonly topLeft: number
  readonly topRight: number
  readonly bottomRight: number
  readonly bottomLeft: number
}

export interface RadiusFieldProps extends ValueControlProps<RadiusValue> {
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly step?: number | undefined
  readonly unit?: string | undefined
  readonly linked?: boolean | undefined
}
