'use client'

import { ExportIcon } from '@motion-studio/icons'
import { Button, Kbd } from '@motion-studio/ui'

import { useStudio } from '../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../store/editor-store'

/** The one accent-carrying control in the chrome — § Character. */
export function ExportButton() {
  const { chrome } = useStudio()
  const setOpen = useStudioStore((state) => state.setExportDialogOpen)

  return (
    <Button
      /*
       * Named for the specs rather than found by its text: the word "Export" appears inside blocks on
       * the canvas too — a hero's own trust list carries "Exports as CSS" — and a role-and-text query
       * matches both.
       */
      data-testid="export-button"
      leadingIcon={<ExportIcon size={16} />}
      onClick={() => setOpen(true)}
      size="sm"
      variant="primary"
    >
      {chrome.export}
      <Kbd keys="Mod+Shift+E" />
    </Button>
  )
}
