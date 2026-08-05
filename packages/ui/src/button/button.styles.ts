import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { DISABLED, FOCUS_RING, PRESS } from '../styles/variants'

/**
 * `cva` rather than conditional class strings in markup — `CODE_STANDARDS.md` § Styling.
 *
 * Heights come from `density.ts`, colours from the semantic tokens. No gradients and no glow: § Character
 * keeps those for content surfaces.
 */
export const buttonStyles = cva(
  [
    'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-medium',
    'transition-colors duration-[--ms-duration-fast] ease-[--ms-ease-standard]',
    FOCUS_RING,
    PRESS,
    DISABLED,
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent text-foreground-onAccent hover:bg-accent-hover active:bg-accent-active',
        secondary:
          'border border-border-strong bg-surface-2 text-foreground hover:bg-surface-3 active:bg-surface-2',
        ghost: 'text-foreground-muted hover:bg-surface-2 hover:text-foreground active:bg-surface-3',
        danger: 'bg-danger text-foreground-onAccent hover:opacity-90 active:opacity-100',
      },
      size: {
        sm: `${HEIGHT_CLASS.smallButton} px-2 text-xs`,
        md: `${HEIGHT_CLASS.controlRow} px-3 text-xs`,
        icon: `${HEIGHT_CLASS.iconButton} p-0`,
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonStyleProps = VariantProps<typeof buttonStyles>
