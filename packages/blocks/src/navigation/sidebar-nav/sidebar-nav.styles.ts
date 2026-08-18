import { cva } from 'class-variance-authority'

import { NAV_GROUP_HEADING, NAV_TOOLTIP, NAV_TRANSITION } from '../navigation.styles'

/**
 * The column. 256 px expanded is two words of a link label plus its glyph without wrapping; 64 px
 * collapsed is a 40 px target with 12 px of air on each side.
 */
export const sidebarNavStyles = cva(
  ['flex shrink-0 flex-col gap-6 border-border border-r bg-surface-0 py-4', NAV_TRANSITION].join(
    ' ',
  ),
  {
    variants: {
      collapsed: { true: 'w-16 items-center px-3', false: 'w-64 px-3' },
      hidden: { true: 'hidden', false: 'flex' },
    },
    defaultVariants: { collapsed: false, hidden: false },
  },
)

export const SIDEBAR_GROUP = 'flex w-full flex-col gap-1'

/**
 * A plain group's heading carries the same 12 px inset the disclosure's trigger gives its own, so both
 * kinds of heading line up with each other and with the glyphs in the list below them. Measured at 1440:
 * heading text and item glyphs both at x = 24.
 */
export const SIDEBAR_HEADING = `${NAV_GROUP_HEADING} px-3`

export const SIDEBAR_LIST = 'm-0 flex list-none flex-col gap-0.5 p-0'

/**
 * The disclosure. The heading is the button's parent rather than its child — the structure
 * `faq-accordion` uses, and for its reason: a screen reader reads "heading, button, expanded", and a
 * heading nested *inside* a button is interactive content inside a name.
 */
export const SIDEBAR_TRIGGER = [
  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left',
  NAV_TRANSITION,
  'hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2',
].join(' ')

export const SIDEBAR_CHEVRON =
  'shrink-0 transition-transform [transition-duration:var(--ms-duration-fast)] data-[state=closed]:-rotate-90'

/** In the rail the link is a 40 px square, and the group it opens is the tooltip beside it. */
export const sidebarLinkStyles = cva('group/nav', {
  variants: {
    collapsed: { true: 'size-10 justify-center px-0', false: '' },
  },
  defaultVariants: { collapsed: false },
})

/** The rail's label, to the right of the glyph. The mechanism is `NAV_TOOLTIP`; this is its place. */
export const SIDEBAR_TOOLTIP = `${NAV_TOOLTIP} left-full ml-2`
