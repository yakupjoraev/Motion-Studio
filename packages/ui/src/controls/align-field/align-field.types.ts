import type { ValueControlProps } from '../control-row/index'

export type AlignAxisValue = 'start' | 'center' | 'end'

export interface AlignValue {
  readonly horizontal: AlignAxisValue
  readonly vertical: AlignAxisValue
}

export type AlignFieldProps = ValueControlProps<AlignValue>
