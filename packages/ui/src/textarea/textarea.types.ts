import type { TextareaHTMLAttributes } from 'react'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  /** Rows before it starts growing. Defaults to 2 — the chrome is dense. */
  readonly minRows?: number
  /** Rows past which it scrolls instead of growing, so a long value cannot push a panel off screen. */
  readonly maxRows?: number
  readonly invalid?: boolean
}
