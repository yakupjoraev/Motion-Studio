import type { ReactElement } from 'react'

import { ScrubField } from '../scrub-field/index'
import { SegmentedField } from '../segmented-field/index'
import { AngleDial } from './angle-dial'
import { atOf } from './gradient-kind'

import type { Gradient, Position } from '@motion-studio/tokens'

export interface GradientGeometryProps {
  readonly value: Gradient
  readonly label: string
  readonly disabled: boolean
  readonly onEdit: (gradient: Gradient, commit: boolean) => void
}

const SHAPES = [
  { value: 'ellipse', content: 'Ellipse', label: 'Ellipse' },
  { value: 'circle', content: 'Circle', label: 'Circle' },
]

/** The part of a gradient that is not its stops: the turn, the shape, and the centre. */
export function GradientGeometry({
  value,
  label,
  disabled,
  onEdit,
}: GradientGeometryProps): ReactElement | null {
  const at = atOf(value)

  const withAt = (next: Position): Gradient =>
    value.kind === 'radial' || value.kind === 'conic' ? { ...value, at: next } : value

  const centre = (
    <>
      {(['x', 'y'] as const).map((axis) => (
        <ScrubField
          key={axis}
          label={`${label} centre ${axis.toUpperCase()}`}
          value={at[axis]}
          min={0}
          max={100}
          unit="%"
          disabled={disabled}
          className="w-[52px] shrink-0"
          onChange={(next) => onEdit(withAt({ ...at, [axis]: next }), false)}
          onCommit={(next) => onEdit(withAt({ ...at, [axis]: next }), true)}
        />
      ))}
    </>
  )

  if (value.kind === 'linear') {
    return (
      <span className="flex items-center gap-1">
        <AngleDial
          label={`${label} angle`}
          value={value.angle}
          disabled={disabled}
          onChange={(angle) => onEdit({ ...value, angle }, false)}
          onCommit={(angle) => onEdit({ ...value, angle }, true)}
        />
        <ScrubField
          label={`${label} angle value`}
          value={value.angle}
          min={0}
          max={360}
          unit="deg"
          disabled={disabled}
          className="w-[64px] shrink-0"
          onChange={(angle) => onEdit({ ...value, angle }, false)}
          onCommit={(angle) => onEdit({ ...value, angle }, true)}
        />
      </span>
    )
  }

  if (value.kind === 'radial') {
    return (
      <span className="flex items-center gap-1">
        <SegmentedField
          label={`${label} shape`}
          value={value.shape}
          options={SHAPES}
          disabled={disabled}
          onChange={() => undefined}
          onCommit={(shape) =>
            onEdit({ ...value, shape: shape === 'circle' ? 'circle' : 'ellipse' }, true)
          }
        />
        {centre}
      </span>
    )
  }

  if (value.kind === 'conic') {
    return (
      <span className="flex items-center gap-1">
        <AngleDial
          label={`${label} start angle`}
          value={value.from}
          disabled={disabled}
          onChange={(from) => onEdit({ ...value, from }, false)}
          onCommit={(from) => onEdit({ ...value, from }, true)}
        />
        {centre}
      </span>
    )
  }

  return null
}
