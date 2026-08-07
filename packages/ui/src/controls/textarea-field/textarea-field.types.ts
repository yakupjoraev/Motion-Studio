import type { ValueControlProps } from '../control-row/index'

export interface TextareaFieldProps extends ValueControlProps<string> {
  /** Rows before it starts growing. `COMPONENT_LIBRARY.md` § Control kinds calls this `rows`. */
  readonly rows?: number | undefined
  readonly maxRows?: number | undefined
  readonly maxLength?: number | undefined
  readonly placeholder?: string | undefined
  readonly invalid?: boolean | undefined
}
