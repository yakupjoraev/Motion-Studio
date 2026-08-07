import { type VariantProps, cva } from 'class-variance-authority'

/** The `*-muted` tokens sit at `surface-2`'s lightness, so a badge reads level with its row. */
export const badgeStyles = cva(
  [
    'inline-flex h-[16px] items-center rounded-xs px-1.5 font-medium text-2xs',
    'whitespace-nowrap tabular-nums',
  ],
  {
    variants: {
      tone: {
        neutral: 'bg-surface-2 text-foreground-muted',
        accent: 'bg-accent-muted text-accent-ring',
        success: 'bg-success-muted text-success',
        warning: 'bg-warning-muted text-warning',
        danger: 'bg-danger-muted text-danger',
        info: 'bg-info-muted text-info',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type BadgeStyleProps = VariantProps<typeof badgeStyles>
