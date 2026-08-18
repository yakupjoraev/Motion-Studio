import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../interactive.styles'

/**
 * The recessed track — the shape a mode switch has everywhere a reader has already seen one — and, inside it, one raised choice — the value relationship `packages/ui`'s segmented
 * control proves works in *both* modes: the ladders run opposite ways (light elevates toward white, dark toward
 * lighter grey), so a well at `surface-inset` with the choice at `surface-3` is the one pair that reads as
 * raised on either side.
 */
export const toggleRootStyles = cva('gap-1 rounded-lg border border-border bg-surface-inset p-1', {
  variants: { hidden: { true: 'hidden', false: 'inline-flex' } },
  defaultVariants: { hidden: false },
})

/**
 * One choice. The selected one is raised out of the track — a surface, a weight and a shadow — and
 * `aria-pressed` is on the element besides, so the state is never colour alone.
 *
 * Width comes from a compound variant rather than from the size row: the icon-only shape is a square and the
 * labelled one is padded, and expressing both in one `size` variant would put two `px-*` utilities on one
 * element, which Tailwind resolves by the order it emits them rather than the order they are written.
 */
export const toggleChoiceStyles = cva(
  [
    'inline-flex select-none items-center justify-center gap-2 rounded-md font-medium text-foreground-muted',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'hover:text-foreground',
    'aria-pressed:bg-surface-3 aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-xs',
  ].join(' '),
  {
    variants: {
      variant: { segmented: '', icons: '' },
      size: { sm: 'h-8 text-base', md: 'h-10 text-md', lg: 'h-12 text-lg' },
    },
    compoundVariants: [
      { variant: 'segmented', size: 'sm', class: 'px-2.5' },
      { variant: 'segmented', size: 'md', class: 'px-3' },
      { variant: 'segmented', size: 'lg', class: 'px-4' },
      { variant: 'icons', size: 'sm', class: 'w-8' },
      { variant: 'icons', size: 'md', class: 'w-10' },
      { variant: 'icons', size: 'lg', class: 'w-12' },
    ],
    defaultVariants: { variant: 'segmented', size: 'sm' },
  },
)
