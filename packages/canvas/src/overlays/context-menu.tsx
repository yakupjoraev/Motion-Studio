'use client'

import { ContextMenu } from '@motion-studio/ui'
import { type ReactNode, useState } from 'react'

import type { CanvasMenuPort } from '../canvas.types'

import { canvasMenuEntries } from './menu-items'

export interface CanvasContextMenuProps {
  readonly menu: CanvasMenuPort
  readonly children: ReactNode
}

/**
 * The right-click menu over the whole canvas. Availability is asked for on open rather than on
 * render: whether Paste has anything to paste is a question about the clipboard at that moment.
 *
 * Every item is also a shortcut and will be in the command palette — PRODUCT.md § 3 makes this a
 * convenience and never the only path to a command.
 */
export function CanvasContextMenu({ menu, children }: CanvasContextMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <ContextMenu items={open ? canvasMenuEntries(menu) : []} onOpenChange={setOpen}>
      {children}
    </ContextMenu>
  )
}
