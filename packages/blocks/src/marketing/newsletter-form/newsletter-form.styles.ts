import { cva } from 'class-variance-authority'

import { MARKETING_FOCUS, MARKETING_TRANSITION } from '../marketing.styles'
import { innerRadiusClass } from '../nested-radius'

/** `hidden` is a class rather than an early return, so a hidden block keeps its place in the tree. */
export const newsletterStackStyles = cva('@container/frame w-full max-w-xl flex-col', {
  variants: {
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const NEWSLETTER_HEADING = 'm-0 font-semibold text-2xl text-foreground'

export const NEWSLETTER_DESCRIPTION = 'mt-3 mb-0 text-pretty text-foreground-muted'

export const NEWSLETTER_FORM = 'flex flex-col gap-2'

export const NEWSLETTER_LABEL = 'font-medium text-foreground text-base'

/**
 * The field and the button sit on one inset plate above `sm`, and stack below it — a 44 px button beside a
 * field inside 360 px leaves the field 140 px wide, which is four characters of an email address.
 *
 * The plate is `lg` (12 px) and holds its contents 4 px in, so both children take
 * `innerRadius(12, 4)` — the nested-radius rule through the helper, which is what prompt 38 asks of every
 * control inside a surface.
 */
const PLATE_RADIUS = 'lg' as const
const PLATE_PADDING_PX = 4

export const NEWSLETTER_PLATE =
  'flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-1 @min-[640px]/frame:flex-row @min-[640px]/frame:items-center'

export const newsletterFieldStyles = cva(
  [
    'h-11 w-full min-w-0 bg-transparent px-3 text-foreground text-md placeholder:text-foreground-subtle',
    innerRadiusClass(PLATE_RADIUS, PLATE_PADDING_PX),
    MARKETING_TRANSITION,
    MARKETING_FOCUS,
  ].join(' '),
  {
    variants: {
      invalid: {
        // A ring as well as the message: the field itself has to say which one is wrong.
        true: 'ring-1 ring-danger',
        false: '',
      },
    },
  },
)

export const newsletterSubmitStyles = cva(
  [
    'inline-flex h-11 shrink-0 items-center justify-center gap-2 px-5 font-medium text-md',
    innerRadiusClass(PLATE_RADIUS, PLATE_PADDING_PX),
    MARKETING_TRANSITION,
    MARKETING_FOCUS,
  ].join(' '),
  {
    variants: {
      busy: {
        true: 'cursor-progress bg-accent/70 text-foreground-onAccent',
        false: 'bg-accent text-foreground-onAccent shadow-md hover:bg-accent-hover',
      },
    },
  },
)

export const NEWSLETTER_NOTE = 'mt-3 mb-0 text-foreground-subtle text-base'

/** The message under the field. One element, four states, so nothing jumps as the state changes. */
export const newsletterMessageStyles = cva('mt-3 mb-0 text-base', {
  variants: {
    tone: {
      idle: 'text-foreground-subtle',
      loading: 'text-foreground-muted',
      success: 'text-success',
      error: 'text-danger',
    },
  },
})
