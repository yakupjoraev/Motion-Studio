import { cva } from 'class-variance-authority'

import { NAV_INNER, NAV_TRANSITION } from '../navigation.styles'

/**
 * The bar.
 *
 * The sticky variant starts transparent and *earns* its treatment: a glass bar sitting over the top of a
 * hero at scroll position 0 blurs the hero's own first 64 px, which reads as a rendering fault rather
 * than as chrome. `data-scrolled` arrives from the scroll bus (ADR-191), so the whole switch is a class.
 */
export const navbarStyles = cva(
  ['relative z-40 w-full border-b border-transparent', NAV_TRANSITION].join(' '),
  {
    variants: {
      sticky: {
        true: 'sticky top-0 data-[scrolled=true]:border-border data-[scrolled=true]:bg-surface-0/80 data-[scrolled=true]:shadow-sm data-[scrolled=true]:backdrop-blur-xl',
        false: 'border-border bg-surface-0',
      },
      hidden: { true: 'hidden', false: 'block' },
    },
    defaultVariants: { sticky: true, hidden: false },
  },
)

/** 64 px, which is the height a 40 px touch target and a 36 px button both sit inside comfortably. */
export const NAVBAR_INNER = `${NAV_INNER} h-16 justify-between`

/** The menu and the actions are desktop-only; below `md` the drawer is the whole navigation. */
export const NAVBAR_MENU = 'relative hidden md:flex'

export const NAVBAR_MENU_LIST = 'm-0 flex list-none items-center gap-1 p-0'

export const NAVBAR_ACTIONS = 'hidden items-center gap-2 md:flex'

export const NAVBAR_TRIGGER_CHEVRON =
  'transition-transform [transition-duration:var(--ms-duration-fast)] data-[state=open]:rotate-180'

/**
 * The dropdown panel. Radix positions it through the viewport below; these are its surface and its
 * measure — 280 px is two lines of a 140-character description without a fourth word on its own row.
 */
export const NAVBAR_PANEL = 'w-[min(20rem,calc(100vw-3rem))] p-2'

export const NAVBAR_PANEL_LIST = 'm-0 flex list-none flex-col gap-0.5 p-0'

export const NAVBAR_PANEL_LABEL = 'font-medium text-foreground text-base'

/**
 * The viewport is what makes one panel replace another rather than two panels overlapping. It is
 * absolutely positioned under the list, and it is `left-0` rather than centred because a bar's menus
 * belong under the item that opened them, not under the middle of the bar.
 */
export const NAVBAR_VIEWPORT_WRAPPER = 'absolute top-full left-0 flex w-full justify-start'

export const NAVBAR_VIEWPORT = [
  'relative mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)]',
  'overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg',
  'transition-[width,height] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]',
].join(' ')
