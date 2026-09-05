import { cva } from 'class-variance-authority'

import { LABEL_COLUMN_CLASS, MIN_HEIGHT_CLASS } from '../../styles/density'

/**
 * A minimum height, not a fixed one. Every single-line control is 26 px inside a 28 px row and looks
 * identical either way; a `textarea` is two lines and a list control is as many as it has items, and
 * with a fixed height those drew straight over the row below — ADR-302.
 */
export const controlRowStyles = cva([
  'flex items-center gap-1.5 py-0.5 pr-1',
  MIN_HEIGHT_CLASS.controlRow,
])

/** The dot's gutter is reserved whether or not a dot is in it, so labels line up down the panel. */
export const controlRowDotSlotStyles = cva('flex w-[8px] shrink-0 justify-center')

/**
 * § Control rows: a 4 px dot to the left of the label. The geometry is the guideline's; which tone a
 * given state takes is the caller's — ADR-161.
 */
export const controlRowDotStyles = cva('h-[4px] w-[4px] rounded-full', {
  variants: { tone: { accent: 'bg-accent', muted: 'bg-foreground-subtle' } },
  defaultVariants: { tone: 'accent' },
})

export const controlRowLabelStyles = cva([
  'shrink-0 truncate text-foreground-muted text-xs',
  LABEL_COLUMN_CLASS,
])

export const controlRowControlStyles = cva('flex min-w-0 flex-1 items-center gap-1')

/**
 * The stacked row — § Control rows, ADR-352. A control built out of controls has the panel's whole
 * width and wears its label above, because the 88 px label column plus an item's own four buttons
 * leave the item's name 11 px of 320.
 */
export const controlRowStackedStyles = cva([
  'flex flex-col items-stretch gap-1 py-0.5 pr-1',
  MIN_HEIGHT_CLASS.controlRow,
])

/**
 * No fixed column here: the label owns the line, so it truncates against the panel rather than 88 px.
 * `w-auto` is load-bearing — `Label` carries `LABEL_COLUMN_CLASS` itself, and `flex-1` does not
 * override a width, so without it the stacked label stays 88 px wide.
 */
export const controlRowStackedLabelStyles = cva(
  'w-auto min-w-0 flex-1 truncate text-foreground-muted text-xs',
)

/** Held in the layout even when hidden: a row must not reflow when a value starts differing. */
export const controlRowResetStyles = cva('shrink-0', {
  variants: { visible: { true: '', false: 'invisible' } },
  defaultVariants: { visible: false },
})
