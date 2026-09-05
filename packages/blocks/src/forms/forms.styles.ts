import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../interactive/interactive.styles'

/**
 * The category's surface language.
 *
 * The focus ring and the transition come from `interactive` rather than from a fourth copy of the same two
 * class lists: a field and a button that sit next to each other on the same exported page have to draw the same
 * ring, and one of them cannot be the place that decides it. Everything below this line is the field itself,
 * which `interactive` has no equivalent of.
 */
export const FORM_FIELD = 'flex w-full flex-col gap-2'

export const formBlockStyles = cva('@container/frame w-full', {
  variants: {
    hidden: { true: 'hidden', false: 'block' },
  },
})

export const FIELD_LABEL = 'font-medium text-foreground text-base'

/** The visible half of the required marking. Muted, because it is a qualifier rather than the label. */
export const FIELD_REQUIRED = 'ml-1 font-normal text-foreground-muted'

/**
 * The control. `h-12` is the `md` row `interactive/interactive.styles.ts` settles on, so a field beside a
 * submit button is the same height as the button — the one measurement the two categories have to agree on.
 *
 * The invalid state is a ring **as well as** the message: colour is never the only carrier of meaning, and the
 * field itself has to say which one of five is wrong.
 */
export const fieldControlStyles = cva(
  [
    'h-12 w-full min-w-0 rounded-md border bg-surface-1 px-4 text-foreground text-md',
    'placeholder:text-foreground-subtle',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'disabled:cursor-not-allowed disabled:opacity-55',
  ].join(' '),
  {
    variants: {
      invalid: {
        true: 'border-danger ring-1 ring-danger',
        false: 'border-border-strong',
      },
    },
  },
)

/** A textarea is the control plus room to grow, so the height and the leading are the only differences. */
export const fieldTextareaStyles = cva(
  [
    'w-full min-w-0 resize-y rounded-md border bg-surface-1 px-4 py-3 text-foreground text-md leading-relaxed',
    'placeholder:text-foreground-subtle',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'disabled:cursor-not-allowed disabled:opacity-55',
  ].join(' '),
  {
    variants: {
      invalid: {
        true: 'border-danger ring-1 ring-danger',
        false: 'border-border-strong',
      },
    },
  },
)

export const FIELD_HINT = 'm-0 text-base text-foreground-muted'

/**
 * The error. It keeps its space whether or not it has text, because a message appearing between a field and the
 * next one pushes the rest of the form down as the reader tabs through it.
 */
export const FIELD_ERROR = 'm-0 min-h-5 font-medium text-base text-danger'

/** The fieldset a group of choices lives in. No border: the legend is the grouping, not a box. */
export const FIELD_GROUP = 'm-0 flex w-full flex-col gap-2 border-0 p-0'

export const FIELD_LEGEND = `mb-1 p-0 ${FIELD_LABEL}`

export const choiceListStyles = cva('flex gap-3', {
  variants: {
    layout: {
      stack: 'flex-col',
      inline: 'flex-row flex-wrap gap-x-6',
    },
  },
})

export const CHOICE_ROW = 'flex items-start gap-3'

/**
 * The box or circle. `size-5` with a 2 px accent when checked — the touch target is the whole row, because the
 * label is part of the control's own label element.
 */
export const CHOICE_INPUT = [
  'mt-0.5 size-5 shrink-0 accent-accent',
  INTERACTIVE_TRANSITION,
  INTERACTIVE_FOCUS,
  'disabled:cursor-not-allowed disabled:opacity-55',
].join(' ')

export const CHOICE_LABEL = 'text-base text-foreground'

export const CHOICE_HINT = 'm-0 text-base text-foreground-subtle'

/**
 * The honeypot's wrapper.
 *
 * Off-screen, **not** `display: none` and not `visibility: hidden`: a bot that parses the stylesheet skips a
 * field it can see is hidden, and the point of the field is that a bot fills it in. A one-pixel box at
 * −9999 px is out of view, takes no layout, and is still a real input in the document.
 */
export const HONEYPOT = 'absolute -left-[9999px] size-px overflow-hidden'

export const FORM_ACTIONS =
  'mt-2 flex flex-col gap-3 @min-[640px]/frame:flex-row @min-[640px]/frame:items-center'

/** The form-level message. One element for all four states, so nothing jumps as the state changes. */
export const formMessageStyles = cva('m-0 text-base', {
  variants: {
    tone: {
      idle: 'text-foreground-subtle',
      submitting: 'text-foreground-muted',
      success: 'text-success',
      error: 'text-danger',
    },
  },
})

/** The panel the success message replaces the form with. It takes focus, so it draws a ring when it has it. */
export const FORM_SUCCESS = [
  'flex w-full flex-col gap-2 rounded-lg border border-success/40 bg-success-muted/40 p-6',
  INTERACTIVE_FOCUS,
].join(' ')

export const FORM_SUCCESS_TITLE = 'm-0 font-semibold text-foreground text-md'

export const FORM_SUCCESS_BODY = 'm-0 text-pretty text-base text-foreground-muted'
