import { cva } from 'class-variance-authority'

/**
 * The form's own rhythm. `gap-5` between fields is one step wider than the gap inside a field, so a field reads
 * as a unit rather than as three loose lines.
 */
export const CONTACT_STACK = 'flex w-full max-w-xl flex-col gap-5'

export const contactFrameStyles = cva('w-full', {
  variants: {
    hidden: { true: 'hidden', false: 'block' },
  },
})

export const CONTACT_HEADING = 'm-0 font-semibold text-2xl text-foreground'

export const CONTACT_DESCRIPTION = 'mt-3 mb-0 max-w-prose text-pretty text-foreground-muted'

export const CONTACT_NOTE = 'm-0 text-base text-foreground-subtle'

/** The header sits one step further from the form than the fields sit from each other. */
export const CONTACT_HEADER_GAP = 'mt-8'
