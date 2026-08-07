import type { ValueControlProps } from '../control-row/index'

export interface TextFieldProps extends ValueControlProps<string> {
  readonly maxLength?: number | undefined
  readonly placeholder?: string | undefined
  readonly invalid?: boolean | undefined
}
