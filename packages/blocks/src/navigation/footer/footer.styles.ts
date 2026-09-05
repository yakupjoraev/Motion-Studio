import { cva } from 'class-variance-authority'

import { NAV_TRANSITION } from '../navigation.styles'

export const footerStyles = cva('@container/frame w-full border-border border-t bg-surface-0', {
  variants: { hidden: { true: 'hidden', false: 'block' } },
  defaultVariants: { hidden: false },
})

export const FOOTER_INNER = 'mx-auto w-full max-w-7xl px-6 py-14 @min-[768px]/frame:py-16'

/**
 * The brand column is wider than the link columns and comes first at every width, so the page ends with
 * a sentence about what it was rather than with a list of links.
 */
export const FOOTER_TOP =
  'grid gap-10 @min-[768px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] @min-[1024px]/frame:gap-8'

export const FOOTER_BRAND_COLUMN = 'flex min-w-0 flex-col gap-4'

export const FOOTER_TAGLINE = 'm-0 max-w-[38ch] text-pretty text-foreground-muted text-base'

export const FOOTER_COLUMN = 'flex min-w-0 flex-col gap-3'

export const FOOTER_COLUMN_LIST = 'm-0 flex list-none flex-col gap-2 p-0'

/** Column links sit at the text's own size and take the underline on hover, because they are prose. */
export const FOOTER_LINK = 'px-0 py-0 hover:underline'

export const FOOTER_SOCIALS = 'm-0 flex list-none items-center gap-1 p-0'

/**
 * The legal row. A hairline above it and 24 px of air: it is a different kind of content from the
 * columns, and running it straight on would read as a fifth column.
 */
export const FOOTER_LEGAL =
  'mt-12 flex flex-col gap-4 border-border border-t pt-6 @min-[768px]/frame:flex-row @min-[768px]/frame:items-center @min-[768px]/frame:justify-between'

export const FOOTER_LEGAL_LIST = 'm-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0'

export const FOOTER_LEGAL_LINK = ['px-0 py-0 text-base', NAV_TRANSITION, 'hover:underline'].join(
  ' ',
)

/** Text, so it takes the text-grade token — the reason `NAV_GROUP_HEADING` states. */
export const FOOTER_COPYRIGHT = 'm-0 text-foreground-muted text-base'

/** The slot. Bounded, so a placed block cannot stretch the footer's brand column to the page width. */
export const FOOTER_NEWSLETTER = 'mt-2 w-full max-w-sm'
