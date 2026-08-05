import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * `UI_GUIDELINES.md` § Copy: "Buttons are verbs". The variants are the four the chrome needs — § Character
 * allows exactly one accent colour, used for the primary action and nothing else, so there is one `primary`
 * and everything else is neutral or status.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** `sm` and `md` come from § Density scale; `icon` is the 28 × 28 icon button from the same table. */
export type ButtonSize = 'sm' | 'md' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  /** Rendered before the label. 16 px in panels, 20 px in the toolbar — the caller sizes it. */
  readonly leadingIcon?: ReactNode
  readonly trailingIcon?: ReactNode
}
