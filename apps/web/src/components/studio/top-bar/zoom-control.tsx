'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'

import { useStudio } from '../../../lib/i18n/studio-surface'

/** The viewport it reports arrives in prompt 18; until then 100 % is the truth, and it is not editable. */
export function ZoomControl() {
  const { chrome } = useStudio()

  return (
    <Button
      aria-label={chrome.zoom}
      disabled
      size="sm"
      trailingIcon={<ChevronDownIcon size={16} />}
      variant="ghost"
    >
      <span className="tabular-nums">100%</span>
    </Button>
  )
}
