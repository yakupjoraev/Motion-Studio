import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../interactive.styles'

/**
 * Two shapes. `list` is a divided list with a hairline between rows and none at the ends — a panel bordered
 * top and bottom reads as a box, and a list of disclosures is a list. `cards` separates the rows into their
 * own surfaces, which is what a set of unrelated panels wants.
 *
 * `max-w-3xl` and centred, which is what `faq-accordion` does with the same shape of content and for the same
 * reason: at 1440 an unconstrained row puts the label at one end and its chevron 1 300 px away at the other.
 */
export const accordionRootStyles = cva('mx-auto w-full min-w-0 max-w-3xl', {
  variants: {
    look: {
      list: 'divide-y divide-border border-border border-y',
      cards: 'flex flex-col gap-3',
    },
    hidden: { true: 'hidden', false: 'block' },
  },
  defaultVariants: { look: 'list', hidden: false },
})

export const accordionItemStyles = cva('group min-w-0', {
  variants: {
    look: { list: '', cards: 'rounded-lg border border-border bg-surface-1 px-4' },
  },
  defaultVariants: { look: 'list' },
})

/**
 * The trigger fills the row and is 56 px tall, which is the touch target with room to spare. `text-left`
 * because a centred label with a chevron beside it wanders as the text changes.
 */
export const ACCORDION_TRIGGER = [
  'flex w-full items-center justify-between gap-4 py-5 text-left font-medium text-foreground text-md',
  INTERACTIVE_TRANSITION,
  INTERACTIVE_FOCUS,
  'hover:text-accent',
].join(' ')

export const ACCORDION_LABEL = 'inline-flex min-w-0 items-center gap-2.5'

/** Rotates from Radix's own `data-state`, so there is no React state to keep in sync with the panel. */
export const ACCORDION_CHEVRON = [
  'size-4 shrink-0 text-foreground-muted',
  'transition-transform [transition-duration:var(--ms-duration-fast)]',
  'group-data-[state=open]:rotate-180',
].join(' ')

/** No top padding: the gap above the content belongs to the trigger's `py-5`, or the panel opens with a jump. */
export const ACCORDION_CONTENT = 'pb-5'
