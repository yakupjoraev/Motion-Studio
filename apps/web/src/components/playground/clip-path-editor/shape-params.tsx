'use client'

import { Slider } from '@motion-studio/ui'
import type { ReactElement } from 'react'

import { type ParametricShape, withParameter } from './basic-shape'
import { formatLength } from './parse-polygon'

export interface ShapeParamsProps {
  readonly shape: ParametricShape
  onChange: (next: ParametricShape) => void
}

/**
 * `circle()`, `ellipse()` and `inset()` have no vertices, so they get their numbers instead — the same
 * two-way binding as the handles, one slider per parameter.
 */
export function ShapeParams({ shape, onChange }: ShapeParamsProps): ReactElement {
  return (
    <div
      data-testid="shape-params"
      className="flex flex-wrap gap-x-6 gap-y-2 rounded-md border border-border bg-surface-1/90 p-3"
    >
      {shape.parameters.map((parameter) => (
        <div className="flex min-w-40 flex-1 items-center gap-2" key={parameter.id}>
          <span className="w-16 shrink-0 text-2xs text-foreground-muted">{parameter.label}</span>
          <Slider
            value={parameter.value}
            onValueChange={(next) => onChange(withParameter(shape, parameter.id, next))}
            min={0}
            max={parameter.max}
            step={1}
            aria-label={`${shape.kind} ${parameter.label}`}
          />
          <span className="w-14 shrink-0 text-right font-mono text-2xs text-foreground-muted">
            {formatLength(parameter.value)}
            {parameter.unit}
          </span>
        </div>
      ))}
    </div>
  )
}
