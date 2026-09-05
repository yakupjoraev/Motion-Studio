'use client'

import { RedoIcon, UndoIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'

import { useStudio } from '../../../lib/i18n/studio-surface'

/**
 * Undo and redo, disabled until history exists (prompt 15). No tooltip: a disabled control takes no
 * pointer events, so a tooltip on it is markup that can never be read.
 */
export function HistoryButtons() {
  const { chrome } = useStudio()

  return (
    <div className="flex items-center gap-1">
      <Button aria-label={chrome.undo} disabled size="icon" variant="ghost">
        <UndoIcon size={20} />
      </Button>
      <Button aria-label={chrome.redo} disabled size="icon" variant="ghost">
        <RedoIcon size={20} />
      </Button>
    </div>
  )
}
