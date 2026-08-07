import type { ReactNode } from 'react'

import type { DropdownEntry } from '../dropdown/index'

/**
 * The entries are `Dropdown`'s. A context menu and a dropdown are the same list of commands reached two
 * ways, and giving them separate shapes would mean writing "Duplicate, Mod+D" twice per surface — the
 * layers tree offers both, and the two must not drift.
 */
export type ContextMenuEntry = DropdownEntry

export interface ContextMenuProps {
  /** The region that owns the menu. Right-clicking anywhere inside it opens at the pointer. */
  readonly children: ReactNode
  readonly items: readonly ContextMenuEntry[]
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string
}
