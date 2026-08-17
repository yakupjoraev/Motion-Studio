import { MARKETING_FOCUS, MARKETING_TRANSITION } from '../marketing.styles'

/**
 * The list. A hairline between rows and none at the ends: a panel with a border top and bottom reads as a
 * box, and a FAQ is a list rather than a box.
 */
export const FAQ_ROOT = 'mx-auto w-full max-w-3xl divide-y divide-border border-border border-y'

export const FAQ_ITEM = 'group'

/**
 * The trigger fills the row and is 56 px tall, which is the mobile touch target with room to spare. The
 * question is `text-left` because a centred question with a chevron beside it wanders as the text changes.
 */
export const FAQ_TRIGGER = [
  'flex w-full items-center justify-between gap-4 py-5 text-left font-medium text-foreground text-md',
  MARKETING_TRANSITION,
  MARKETING_FOCUS,
  'hover:text-accent',
].join(' ')

/** Rotates when its panel opens, driven by Radix's own `data-state` — no React state to keep in sync. */
export const FAQ_CHEVRON =
  'size-4 shrink-0 text-foreground-subtle transition-transform [transition-duration:var(--ms-duration-fast)] group-data-[state=open]:rotate-180'

/**
 * The answer. `pb-5` and no top padding: the gap above it belongs to the trigger's own `py-5`, and adding
 * one here would open the panel with a visible jump.
 */
export const FAQ_CONTENT = 'pb-5'

export const FAQ_ANSWER = 'm-0 max-w-prose text-pretty text-foreground-muted'
