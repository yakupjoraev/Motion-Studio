'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'

/** The viewport it reports arrives in prompt 18; until then 100 % is the truth, and it is not editable. */
export function ZoomControl() {
  return (
    <Button
      aria-label="Zoom"
      disabled
      size="sm"
      trailingIcon={<ChevronDownIcon size={16} />}
      variant="ghost"
    >
      <span className="tabular-nums">100%</span>
    </Button>
  )
}
