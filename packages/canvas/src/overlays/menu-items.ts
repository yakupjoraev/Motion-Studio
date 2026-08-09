import type { ContextMenuEntry } from '@motion-studio/ui'

import type { CanvasMenuAction, CanvasMenuPort } from '../canvas.types'

export interface CanvasMenuItem {
  readonly action: CanvasMenuAction
  readonly label: string
  /** The registry's notation, from SHORTCUTS.md. ADR-098: absent where that document has none. */
  readonly shortcut?: string
  readonly danger?: boolean
  /** A separator follows this item. */
  readonly divide?: boolean
}

/** PRODUCT.md § 3, in its order, with the bindings SHORTCUTS.md § Editing already assigns. */
export const CANVAS_MENU_ITEMS: readonly CanvasMenuItem[] = [
  { action: 'duplicate', label: 'Duplicate', shortcut: 'Mod+D' },
  { action: 'copy', label: 'Copy', shortcut: 'Mod+C' },
  { action: 'paste', label: 'Paste', shortcut: 'Mod+V' },
  { action: 'pasteStyle', label: 'Paste style', shortcut: 'Mod+Alt+V' },
  { action: 'delete', label: 'Delete', shortcut: 'Delete', danger: true, divide: true },
  { action: 'bringForward', label: 'Bring forward', shortcut: 'Mod+]' },
  { action: 'sendBackward', label: 'Send backward', shortcut: 'Mod+[', divide: true },
  { action: 'wrap', label: 'Wrap in container', shortcut: 'Mod+G' },
  { action: 'unwrap', label: 'Unwrap', shortcut: 'Mod+Shift+G', divide: true },
  { action: 'addMotion', label: 'Add motion' },
  { action: 'copyReact', label: 'Copy React' },
  { action: 'resetOverrides', label: 'Reset overrides' },
]

/**
 * The entries `ui`'s menu takes. A disabled item carries its reason as the hint — ADR-095, because a
 * disabled Radix item takes no pointer events and a tooltip on one would never open.
 */
export function canvasMenuEntries(menu: CanvasMenuPort): readonly ContextMenuEntry[] {
  const entries: ContextMenuEntry[] = []

  for (const item of CANVAS_MENU_ITEMS) {
    const reason = menu.unavailable(item.action)

    entries.push({
      id: item.action,
      label: item.label,
      disabled: reason !== undefined,
      danger: item.danger ?? false,
      onSelect: () => menu.run(item.action),
      ...(reason === undefined
        ? item.shortcut === undefined
          ? {}
          : { shortcut: item.shortcut }
        : { hint: reason }),
    })

    if (item.divide === true) {
      entries.push({ kind: 'separator', id: `after-${item.action}` })
    }
  }

  return entries
}
