import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../interactive.styles'

/**
 * Two shapes for one control.
 *
 * `joined` is the segmented row of a toolbar: items share their edges, one hairline between each pair, and
 * the ends are the only rounded corners. `segmented` is the recessed plate with the selected item raised
 * out of it, which is the shape that reads as "one of these" from further away.
 */
export const groupRootStyles = cva('inline-flex max-w-full', {
  variants: {
    look: {
      joined: 'isolate',
      segmented: 'gap-1 rounded-lg border border-border bg-surface-inset p-1',
    },
    hidden: { true: 'hidden', false: 'inline-flex' },
  },
  defaultVariants: { look: 'joined', hidden: false },
})

/**
 * One item. The selected state is a surface **and** a weight, never colour alone — ACCESSIBILITY.md
 * § Non-negotiables 4 — and `aria-checked` or `aria-pressed` is on the element besides, which is Radix's.
 *
 * Both attributes are written out because the block uses two primitives (ADR-208): `data-state` is `on` on
 * a Toggle Group item and `checked` on a Radio Group item. A helper that generated the pair would produce
 * class names Tailwind never sees in the source, so the pair is literal and the test asserts it.
 */
export const groupItemStyles = cva(
  [
    'relative inline-flex min-w-0 select-none items-center justify-center gap-2 font-medium',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'focus-visible:z-10',
  ].join(' '),
  {
    variants: {
      look: {
        joined: [
          '-ml-px border border-border-strong bg-surface-2 text-foreground-muted first:ml-0',
          'first:rounded-l-md last:rounded-r-md hover:bg-surface-3 hover:text-foreground',
          'data-[state=on]:z-10 data-[state=on]:border-accent data-[state=on]:bg-accent data-[state=on]:font-semibold data-[state=on]:text-foreground-onAccent',
          'data-[state=checked]:z-10 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:font-semibold data-[state=checked]:text-foreground-onAccent',
        ].join(' '),
        segmented: [
          'rounded-md text-foreground-muted hover:text-foreground',
          'data-[state=on]:bg-surface-3 data-[state=on]:font-semibold data-[state=on]:text-foreground data-[state=on]:shadow-xs',
          'data-[state=checked]:bg-surface-3 data-[state=checked]:font-semibold data-[state=checked]:text-foreground data-[state=checked]:shadow-xs',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-3 text-base',
        md: 'h-11 px-4 text-md',
        lg: 'h-13 px-5 text-lg',
      },
    },
    defaultVariants: { look: 'joined', size: 'md' },
  },
)
