import { LockIcon, UnlockIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useState } from 'react'

import { Button } from '../../button/index'
import { ScrubField } from '../scrub-field/index'

import type { SpacingFieldProps, SpacingValue } from './spacing-field.types'

const SIDES = [
  { key: 'top', label: 'Top' },
  { key: 'right', label: 'Right' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
] as const

/**
 * Four sides with a link toggle — `UI_GUIDELINES.md` § Control rows. Linked, one side drives all four;
 * unlinked, each is its own field. The link is UI state, so it stays out of the committed value.
 */
function SpacingFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  min,
  max,
  step,
  unit = 'px',
  linked: initiallyLinked = true,
  className,
}: SpacingFieldProps): ReactElement {
  const [linked, setLinked] = useState(initiallyLinked)

  const spread = (side: (typeof SIDES)[number]['key'], next: number): SpacingValue =>
    linked ? { top: next, right: next, bottom: next, left: next } : { ...value, [side]: next }

  return (
    <span
      className={cn('flex min-w-0 flex-1 items-center gap-1', className)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {SIDES.map((side, index) => (
        <ScrubField
          key={side.key}
          id={index === 0 ? id : undefined}
          label={`${label} ${side.label.toLowerCase()}`}
          value={value[side.key]}
          min={min}
          max={max}
          step={step}
          unit={unit}
          disabled={disabled}
          mixed={mixed}
          onChange={(next: number) => onChange(spread(side.key, next))}
          onCommit={(next: number) => onCommit(spread(side.key, next))}
          className="min-w-0 flex-1"
        />
      ))}

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Link ${label.toLowerCase()} sides`}
        aria-pressed={linked}
        disabled={disabled}
        onClick={() => setLinked(!linked)}
      >
        {linked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
      </Button>
    </span>
  )
}

export const SpacingField = memo(SpacingFieldImpl)
