import { cva } from 'class-variance-authority'

/** Tabular numerals, because a column of statistics that jitters is a column nobody can compare. */
export const statValueStyles = cva(
  'm-0 font-semibold text-foreground tabular-nums tracking-tight',
  {
    variants: {
      size: {
        md: 'text-3xl',
        lg: 'text-4xl',
        xl: 'text-5xl',
      },
    },
  },
)

export const statStyles = cva('flex flex-col gap-2', {
  variants: {
    align: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    },
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const STAT_LABEL = 'text-foreground-muted text-sm'

export const statDeltaStyles = cva(
  'inline-flex items-center gap-1 font-medium text-sm tabular-nums',
  {
    variants: {
      tone: {
        positive: 'text-success',
        negative: 'text-danger',
        neutral: 'text-foreground-subtle',
      },
    },
  },
)

export const statSparklineStyles = cva('h-8 w-full max-w-[160px]', {
  variants: {
    tone: {
      positive: 'text-success',
      negative: 'text-danger',
      neutral: 'text-accent',
    },
  },
})
