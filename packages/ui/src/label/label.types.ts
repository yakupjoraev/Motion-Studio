import type { LabelHTMLAttributes, ReactNode } from 'react'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  readonly children: ReactNode
  /** Marks the control required. Announced, not only drawn. */
  readonly required?: boolean
}
