'use client'

import { RedoIcon, UndoIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'

/**
 * Undo and redo, disabled until history exists (prompt 15). No tooltip: a disabled control takes no
 * pointer events, so a tooltip on it is markup that can never be read.
 */
export function HistoryButtons() {
  return (
    <div className="flex items-center gap-1">
      <Button aria-label="Undo" disabled size="icon" variant="ghost">
        <UndoIcon size={20} />
      </Button>
      <Button aria-label="Redo" disabled size="icon" variant="ghost">
        <RedoIcon size={20} />
      </Button>
    </div>
  )
}
