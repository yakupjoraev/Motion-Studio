import type { ValueControlProps } from '../control-row/index'

export interface SliderFieldProps extends ValueControlProps<number> {
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly step?: number | undefined
  readonly unit?: string | undefined
  readonly precision?: number | undefined
}
