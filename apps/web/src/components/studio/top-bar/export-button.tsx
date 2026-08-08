'use client'

import { ExportIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'

/** The one accent-carrying control in the chrome — § Character. Disabled until codegen lands. */
export function ExportButton() {
  return (
    <Button disabled leadingIcon={<ExportIcon size={16} />} size="sm" variant="primary">
      Export
    </Button>
  )
}
