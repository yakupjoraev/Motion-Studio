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

/** Held in the layout even when hidden: a row must not reflow when a value starts differing. */
export const controlRowResetStyles = cva('shrink-0', {
  variants: { visible: { true: '', false: 'invisible' } },
  defaultVariants: { visible: false },
})
