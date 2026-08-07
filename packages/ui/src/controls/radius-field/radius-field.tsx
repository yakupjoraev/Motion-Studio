import { LockIcon, UnlockIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useState } from 'react'

import { Button } from '../../button/index'
import { ScrubField } from '../scrub-field/index'

import type { RadiusFieldProps, RadiusValue } from './radius-field.types'

const CORNERS = [
  { key: 'topLeft', label: 'top left' },
  { key: 'topRight', label: 'top right' },
  { key: 'bottomRight', label: 'bottom right' },
  { key: 'bottomLeft', label: 'bottom left' },
] as const

/** Four corners with a link toggle — § Control rows lists radius alongside padding as a linked value. */
function RadiusFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  min = 0,
  max,
  step,
  unit = 'px',
  linked: initiallyLinked = true,
  className,
}: RadiusFieldProps): ReactElement {
  const [linked, setLinked] = useState(initiallyLinked)

  const spread = (corner: (typeof CORNERS)[number]['key'], next: number): RadiusValue =>
    linked
      ? { topLeft: next, topRight: next, bottomRight: next, bottomLeft: next }
      : { ...value, [corner]: next }

  return (
    <span
      className={cn('flex min-w-0 flex-1 items-center gap-1', className)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {CORNERS.map((corner, index) => (
        <ScrubField
          key={corner.key}
          id={index === 0 ? id : undefined}
          label={`${label} ${corner.label}`}
          value={value[corner.key]}
          min={min}
          max={max}
          step={step}
          unit={unit}
          disabled={disabled}
          mixed={mixed}
          onChange={(next: number) => onChange(spread(corner.key, next))}
          onCommit={(next: number) => onCommit(spread(corner.key, next))}
          className="min-w-0 flex-1"
        />
      ))}

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Link ${label.toLowerCase()} corners`}
        aria-pressed={linked}
        disabled={disabled}
        onClick={() => setLinked(!linked)}
      >
        {linked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
      </Button>
    </span>
  )
}

export const RadiusField = memo(RadiusFieldImpl)
