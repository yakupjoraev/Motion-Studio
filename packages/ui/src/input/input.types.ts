import type { InputHTMLAttributes, ReactNode } from 'react'

// React types `prefix` as the HTML attribute of that name, a string. Ours is a node, so it is omitted
// rather than widened — a caller passing a string still works, and one passing an icon typechecks.
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /**
   * Rendered inside the field, before the text. A unit, an icon, a colour swatch. Decorative by default —
   * if it carries meaning the caller labels it, because a prefix is not a label.
   */
  readonly prefix?: ReactNode
  readonly suffix?: ReactNode
  /** Marks the field as failing validation. Sets `aria-invalid`, so the state is not colour-only. */
  readonly invalid?: boolean
}
