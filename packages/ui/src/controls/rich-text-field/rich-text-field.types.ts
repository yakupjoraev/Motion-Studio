import type { ValueControlProps } from '../control-row/index'

/** The value is a fragment of inline HTML: `strong`, `em`, `a`, and text. Nothing else survives. */
export interface RichTextFieldProps extends ValueControlProps<string> {
  readonly placeholder?: string | undefined
}
