import { cva } from 'class-variance-authority'

export const waitlistFrameStyles = cva('w-full max-w-lg', {
  variants: {
    hidden: { true: 'hidden', false: 'block' },
  },
})

/**
 * The field and the button on one row above `sm`, stacked below it.
 *
 * A 48 px button beside a field inside 360 px leaves the field about 140 px wide, which is four characters of an
 * email address — the measurement `newsletter-form` made and the reason both of them stack on a phone.
 */
export const WAITLIST_ROW =
  'flex w-full flex-col gap-3 @min-[640px]/frame:flex-row @min-[640px]/frame:items-start'

export const WAITLIST_NOTE = 'm-0 mt-3 text-base text-foreground-subtle'
