import type { ValueControlProps } from '../control-row/index'

export interface CssFieldProps extends ValueControlProps<string> {
  /** `COMPONENT_LIBRARY.md` § Control kinds names this prop. Absent means any property is allowed. */
  readonly properties?: readonly string[] | undefined
  readonly rows?: number | undefined
}
