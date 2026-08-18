import { cva } from 'class-variance-authority'

import { NAV_FOCUS, NAV_TRANSITION } from '../navigation.styles'

export const breadcrumbsStyles = cva('w-full', {
  variants: { hidden: { true: 'hidden', false: 'block' } },
  defaultVariants: { hidden: false },
})

/**
 * The trail wraps rather than scrolls. A breadcrumb that scrolls sideways at 360 px puts the reader's own
 * position off screen, which is the one crumb that has to be visible.
 */
export const BREADCRUMBS_LIST =
  'm-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-base'

export const BREADCRUMB_ITEM = 'flex items-center gap-1.5'

export const BREADCRUMB_LINK = [
  'rounded-md px-1 py-0.5 text-foreground-muted no-underline',
  NAV_TRANSITION,
  NAV_FOCUS,
  'hover:text-foreground hover:underline',
].join(' ')

/** The reader's own position: the same size, a full-strength colour, and not a link. */
export const BREADCRUMB_CURRENT = 'px-1 py-0.5 font-medium text-foreground'

export const BREADCRUMB_SEPARATOR = 'select-none text-foreground-subtle'

export const BREADCRUMB_OVERFLOW_TRIGGER = [
  'inline-flex size-7 items-center justify-center rounded-md text-foreground-muted',
  NAV_TRANSITION,
  NAV_FOCUS,
  'hover:bg-surface-2 hover:text-foreground data-[state=open]:bg-surface-2',
].join(' ')

export const BREADCRUMB_MENU = [
  'z-50 min-w-40 rounded-lg border border-border bg-surface-1 p-1 shadow-lg',
].join(' ')

export const BREADCRUMB_MENU_ITEM = [
  'flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-base text-foreground no-underline',
  'outline-none data-[highlighted]:bg-surface-2',
].join(' ')
