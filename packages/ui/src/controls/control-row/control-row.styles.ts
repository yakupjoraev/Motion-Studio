import { cva } from 'class-variance-authority'

import { HEIGHT_CLASS, LABEL_COLUMN_CLASS } from '../../styles/density'

export const controlRowStyles = cva(['flex items-center gap-1.5 pr-1', HEIGHT_CLASS.controlRow])

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
