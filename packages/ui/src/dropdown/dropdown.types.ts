import type { ReactNode } from 'react'

export interface DropdownAction {
  readonly kind?: 'item'
  readonly id: string
  readonly label: string
  /** The registry's notation. Rendered by `Kbd` in the shortcut column. */
  readonly shortcut?: string
  /**
   * Why the item is unavailable, in the same column as the shortcut. A disabled item takes no
   * pointer events — `data-[disabled]:pointer-events-none` — so a tooltip on one never opens, and
   * the reason has to be part of the item to be readable at all.
   */
  readonly hint?: string
  readonly icon?: ReactNode
  readonly disabled?: boolean
  /** The same status colour `Button`'s danger variant uses. */
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
  // No `label`: Radix names the menu after its trigger, and an `aria-label` here is silently overridden.
  readonly side?: 'top' | 'right' | 'bottom' | 'left'
  readonly align?: 'start' | 'center' | 'end'
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string | undefined
}
