import type { HTMLAttributes } from 'react'

export interface SeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  readonly orientation?: 'horizontal' | 'vertical'
  /** A separator that only groups things visually is noise to a screen reader. */
  readonly decorative?: boolean
}
