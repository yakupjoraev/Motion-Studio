import type { ValueControlProps } from '../control-row/index'

export interface ScrubFieldProps extends ValueControlProps<number> {
  readonly min?: number | undefined
  readonly max?: number | undefined
  /** The keyboard step and the value one pixel of drag is worth. Defaults to 1. */
  readonly step?: number | undefined
  /** `px`, `%`, `deg`, `ms`. Rendered inside the field and spoken in `aria-valuetext`. */
  readonly unit?: string | undefined
  /** Decimals shown and rounded to. Defaults to the decimals in `step`. */
  readonly precision?: number | undefined
}
