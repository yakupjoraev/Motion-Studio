import { cva } from 'class-variance-authority'

import { NAV_FOCUS, NAV_TOOLTIP, NAV_TRANSITION } from '../navigation.styles'

export const dockStyles = cva('flex w-full justify-center', {
  variants: { hidden: { true: 'hidden', false: 'flex' } },
  defaultVariants: { hidden: false },
})

/**
 * The tray. `items-end` is what makes the row grow upward from a common baseline, which is the whole
 * shape of a magnifying dock — `items-center` would push the neighbours down as well as up.
 */
export const DOCK_TRAY =
  'ms-glass m-0 flex list-none items-end gap-2 rounded-2xl px-3 py-2 shadow-lg'

/**
 * One item. `ms-dock-item` is where the scale lives (`blocks.css`): the pointer's contribution is a
 * variable the hook writes, the keyboard's is a variable `:focus-visible` writes, and the product of the
 * two is multiplied by `--ms-reduced-motion` so both paths go still together.
 *
 * `group/nav` is for the label above it, and the ring and the surface change on hover and focus
 * independently of the scale — which is what leaves a real affordance when the scale is switched off.
 */
export const DOCK_ITEM = [
  'ms-dock-item group/nav relative inline-flex size-11 items-center justify-center rounded-xl',
  'border border-border bg-surface-2 text-foreground-muted',
  NAV_TRANSITION,
  NAV_FOCUS,
  'hover:border-border-strong hover:bg-surface-3 hover:text-foreground',
  'focus-visible:border-border-strong focus-visible:bg-surface-3 focus-visible:text-foreground',
].join(' ')

/** The active item keeps a mark under the glyph, so the state survives the scale being switched off. */
export const DOCK_ACTIVE_MARK = 'absolute -bottom-1 size-1 rounded-full bg-accent'

export const DOCK_TOOLTIP = `${NAV_TOOLTIP} bottom-full left-1/2 mb-2 -translate-x-1/2`
