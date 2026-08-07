import type { ReactNode } from 'react'

export interface DropdownAction {
  readonly kind?: 'item'
  readonly id: string
  readonly label: string
  /** In the registry's notation — `Mod+Shift+Z`. Rendered by `Kbd` in the shortcut column. */
  readonly shortcut?: string
  readonly icon?: ReactNode
  readonly disabled?: boolean
  /** Destructive actions read in `danger`, the same status colour `Button`'s danger variant uses. */
  readonly danger?: boolean
  readonly onSelect: () => void
}

export interface DropdownSeparator {
  readonly kind: 'separator'
  readonly id: string
}

export interface DropdownGroupLabel {
  readonly kind: 'label'
  readonly id: string
  readonly label: string
}

export type DropdownEntry = DropdownAction | DropdownSeparator | DropdownGroupLabel

export interface DropdownProps {
  /** The element that opens the menu. Rendered as-is — Radix merges the trigger's props onto it. */
  readonly trigger: ReactNode
  readonly items: readonly DropdownEntry[]
  /*
   * There is no `label`: Radix points the menu's `aria-labelledby` at the trigger, so the menu is named by
   * the thing that opened it and the two cannot drift. Measured — an `aria-label` here is silently
   * overridden, because `aria-labelledby` wins.
   */
  readonly side?: 'top' | 'right' | 'bottom' | 'left'
  readonly align?: 'start' | 'center' | 'end'
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string
}
