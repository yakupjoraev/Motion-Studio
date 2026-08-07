import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FLOATING_SURFACE, TRANSITION_CONTROL } from '../styles/variants'

/** The same floating surface as `Select` and `Popover`, so the three read as one family of overlays. */
export const dropdownContentStyles = cva([FLOATING_SURFACE, 'min-w-[180px] overflow-hidden p-1'])

/**
 * A menu row. `layerRow` from the density scale: a menu row and a select row are the same object at the same
 * size, and giving them separate numbers is how two lists start disagreeing.
 *
 * Highlight is `surface-2`, not accent — a highlighted row is a pointer position, not a selection (ADR-032
 * draws the same line). Radix sets `data-highlighted` for both the pointer and the keyboard, so the two
 * cannot look different.
 */
export const dropdownItemStyles = cva(
  [
    'relative flex cursor-default select-none items-center gap-2 rounded-xs px-2 text-xs outline-none',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    HEIGHT_CLASS.layerRow,
    TRANSITION_CONTROL,
  ],
  {
    variants: {
      danger: {
        true: 'text-danger data-[highlighted]:bg-danger-muted data-[highlighted]:text-danger',
        false: 'text-foreground data-[highlighted]:bg-surface-2',
      },
    },
    defaultVariants: { danger: false },
  },
)

/** The shortcut column. `ml-auto` rather than a grid: the labels vary and the hints should still line up. */
export const dropdownShortcutStyles = cva(['ml-auto pl-4'])

export const dropdownSeparatorStyles = cva(['-mx-1 my-1 h-px bg-border'])

/** § Section headers: uppercase, tracked out, muted. A group label is the same object one level down. */
export const dropdownLabelStyles = cva([
  'px-2 pt-2 pb-1 font-medium text-2xs text-foreground-subtle uppercase tracking-[0.06em]',
])

export type DropdownStyleProps = VariantProps<typeof dropdownItemStyles>
