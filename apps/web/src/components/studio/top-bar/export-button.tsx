'use client'

import { ExportIcon } from '@motion-studio/icons'
import { Button, Kbd } from '@motion-studio/ui'

import { useStudioStore } from '../../../store/editor-store'

/** The one accent-carrying control in the chrome — § Character. */
export function ExportButton() {
  const setOpen = useStudioStore((state) => state.setExportDialogOpen)

  return (
    <Button
      leadingIcon={<ExportIcon size={16} />}
      onClick={() => setOpen(true)}
      size="sm"
      variant="primary"
    >
      Export
      <Kbd keys="Mod+Shift+E" />
    </Button>
  )
}
