import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FLOATING_SURFACE, TRANSITION_CONTROL } from '../styles/variants'

/** Same surface as `Select` and `Popover`. */
export const dropdownContentStyles = cva([FLOATING_SURFACE, 'min-w-[180px] overflow-hidden p-1'])

/** Highlight is `surface-2`, not accent: a highlighted row is a pointer position, not a selection. */
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

/** `ml-auto` rather than a grid: the labels vary and the hints still line up. */
export const dropdownShortcutStyles = cva(['ml-auto pl-4'])

/** The reason an item is unavailable, in the shortcut's column. */
export const dropdownHintStyles = cva(['ml-auto pl-4 text-2xs text-foreground-subtle'])

export const dropdownSeparatorStyles = cva(['-mx-1 my-1 h-px bg-border'])

/** § Section headers, one level down. */
export const dropdownLabelStyles = cva([
  'px-2 pt-2 pb-1 font-medium text-2xs text-foreground-subtle uppercase tracking-[0.06em]',
])

export type DropdownStyleProps = VariantProps<typeof dropdownItemStyles>
