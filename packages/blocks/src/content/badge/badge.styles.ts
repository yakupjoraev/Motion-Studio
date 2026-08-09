import { cva } from 'class-variance-authority'

/**
 * A pill is a foreground, a muted surface of the same hue, and a hairline at the same hue's edge. All
 * three come from the one token family, which is what keeps six variants looking like one component
 * rather than six — and what makes them repaint together when the theme changes.
 */
export const badgeStyles = cva(
  'inline-flex w-fit items-center gap-1.5 rounded-full border font-medium',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-surface-2 text-foreground-muted',
        accent: 'border-accent/25 bg-accent-muted text-accent',
        success: 'border-success/25 bg-success-muted text-success',
        warning: 'border-warning/25 bg-warning-muted text-warning',
        danger: 'border-danger/25 bg-danger-muted text-danger',
        info: 'border-info/25 bg-info-muted text-info',
      },
      size: {
        sm: 'px-2 py-0.5 text-2xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
      hidden: { true: 'hidden', false: 'inline-flex' },
    },
  },
)

/** `currentColor`, so the dot never needs its own variant table. */
export const BADGE_DOT = 'size-1.5 shrink-0 rounded-full bg-current'

export const badgeIconStyles = cva('shrink-0', {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-3.5',
      lg: 'size-4',
    },
  },
})
