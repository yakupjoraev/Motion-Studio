import type { SelectOption } from '../../select/index'
import type { ValueControlProps } from '../control-row/index'

export interface SelectFieldProps extends ValueControlProps<string> {
  readonly options: readonly SelectOption[]
  readonly placeholder?: string | undefined
  readonly invalid?: boolean | undefined
}
