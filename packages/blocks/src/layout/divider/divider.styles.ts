import { cva } from 'class-variance-authority'

export const dividerStyles = cva('shrink-0 border-border', {
  variants: {
    orientation: { horizontal: 'w-full border-t', vertical: 'h-full border-l' },
    lineStyle: { solid: 'border-solid', dashed: 'border-dashed', dotted: 'border-dotted' },
    spacing: {
      none: 'my-0',
      xs: 'my-1',
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-8',
      xl: 'my-12',
    },
    hidden: { true: 'hidden', false: 'block' },
  },
})

/** The labelled form: a rule, the text, a rule — the thing that is on every second landing page. */
export const dividerLabelledStyles = cva('flex w-full items-center gap-3', {
  variants: {
    spacing: {
      none: 'my-0',
      xs: 'my-1',
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-8',
      xl: 'my-12',
    },
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const dividerRuleStyles = cva('h-px flex-1', {
  variants: {
    lineStyle: {
      solid: 'border-border border-t border-solid',
      dashed: 'border-border border-t border-dashed',
      dotted: 'border-border border-t border-dotted',
    },
    fade: {
      true: 'border-none bg-gradient-to-r from-transparent via-border to-transparent',
      false: '',
    },
  },
})

export const dividerTextStyles = cva(
  'shrink-0 text-2xs text-foreground-muted uppercase tracking-[0.08em]',
)
