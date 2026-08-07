import type { ValueControlProps } from '../control-row/index'

export interface SwitchFieldProps extends ValueControlProps<boolean> {
  /** A short clarification rendered beside the switch — `COMPONENT_LIBRARY.md` § Control kinds. */
  readonly hint?: string | undefined
}
