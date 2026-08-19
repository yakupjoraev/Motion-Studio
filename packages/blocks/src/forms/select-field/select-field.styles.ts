import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS, INTERACTIVE_TRANSITION } from '../../interactive/interactive.styles'

/**
 * The trigger. The field geometry, plus the two things a text input does not need: room for the chevron at the
 * end, and `text-left` — a button centres its content and a field's value belongs where a typed value would be.
 */
export const selectTriggerStyles = cva(
  [
    'flex h-12 w-full items-center justify-between gap-2 rounded-md border bg-surface-1 px-4',
    'text-left text-foreground text-md',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'disabled:cursor-not-allowed disabled:opacity-55',
    'data-[placeholder]:text-foreground-subtle',
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

export const SELECT_CHEVRON = 'shrink-0 text-foreground-muted'

/**
 * The list. A floating surface, so it takes the shadow DESIGN_SYSTEM.md § Elevation reserves for things that
 * float, and it matches the trigger's width through Radix's own `--radix-select-trigger-width`.
 */
export const SELECT_CONTENT = [
  'z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
  'rounded-md border border-border bg-surface-1 p-1 shadow-lg',
].join(' ')

export const SELECT_VIEWPORT = 'p-0'

/**
 * An option. The highlight is Radix's `data-[highlighted]`, which follows both the pointer and the keyboard —
 * one rule for both, so the two can never disagree about which option is current.
 */
export const SELECT_ITEM = [
  'relative flex cursor-pointer select-none items-center justify-between gap-3 rounded-sm px-3 py-2',
  'text-base text-foreground outline-none',
  'data-[highlighted]:bg-surface-2 data-[highlighted]:text-foreground',
  'data-[state=checked]:font-medium',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-55',
].join(' ')

export const SELECT_INDICATOR = 'text-accent'
