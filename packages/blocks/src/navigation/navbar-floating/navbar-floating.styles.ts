import { cva } from 'class-variance-authority'

import { NAV_TRANSITION } from '../navigation.styles'

/**
 * The detached pill.
 *
 * `ms-glass` rather than a blur this block picked, so the treatment follows the document's own theme —
 * DESIGN_SYSTEM.md § Blur and glass. `ms-nav-glass` is the one declaration a utility cannot express: the
 * scrolled state composes *with* the theme's recipe instead of replacing it, so a preset with
 * `glassLevel: none` gets a more opaque pill and still no blur (`blocks.css`).
 *
 * Padding is the thing that shrinks, and it shrinks by 4 px. Anything larger moves the links under the
 * reader's cursor, which is a bar that fights the pointer rather than a bar that settles.
 */
export const navbarFloatingStyles = cva(
  [
    // `@container/frame` — ADR-356, so the link row's own width decides whether it fits.
    '@container/frame ms-glass ms-nav-glass sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-3xl items-center',
    'justify-between gap-3 rounded-full py-2 pr-2 pl-4 shadow-lg',
    'data-[scrolled=true]:py-1 data-[scrolled=true]:shadow-xl',
    NAV_TRANSITION,
  ].join(' '),
  {
    variants: { hidden: { true: 'hidden', false: 'flex' } },
    defaultVariants: { hidden: false },
  },
)

/** Below `sm` the pill is the brand, the drawer trigger and nothing else — there is no room for a row. */
export const FLOATING_LINKS =
  'm-0 hidden list-none items-center gap-0.5 p-0 @min-[640px]/frame:flex'

export const FLOATING_ACTIONS = 'flex items-center gap-2'

/** The pill's own links sit tighter than a full bar's: a 40 px row inside a 48 px pill has no air. */
export const FLOATING_LINK = 'px-2.5 py-1.5'
