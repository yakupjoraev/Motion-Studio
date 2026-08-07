import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** § Character allows one accent, spent on the primary action, so there is exactly one `primary`. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** All three come from § Density scale. */
export type ButtonSize = 'sm' | 'md' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  /** 16 px in panels, 20 px in the toolbar — the caller sizes it. */
  readonly leadingIcon?: ReactNode
  readonly trailingIcon?: ReactNode
}
