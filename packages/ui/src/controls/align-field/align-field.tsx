import { cn } from '@motion-studio/utils'
import { type KeyboardEvent, type ReactElement, memo } from 'react'

import { controlLabelProps } from '../control-row/index'
import { alignCellStyles, alignDotStyles, alignFieldStyles } from './align-field.styles'

import type { AlignAxisValue, AlignFieldProps, AlignValue } from './align-field.types'

const AXIS: readonly AlignAxisValue[] = ['start', 'center', 'end']

const NAMES: Readonly<Record<AlignAxisValue, Readonly<Record<AlignAxisValue, string>>>> = {
  start: { start: 'Top left', center: 'Top centre', end: 'Top right' },
  center: { start: 'Middle left', center: 'Centre', end: 'Middle right' },
  end: { start: 'Bottom left', center: 'Bottom centre', end: 'Bottom right' },
}

/** Arrow keys walk the grid in two dimensions; wrapping would make a corner unreachable by feel. */
const STEP: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

const clampIndex = (index: number): number => Math.min(2, Math.max(0, index))

const axisAt = (index: number): AlignAxisValue => AXIS[clampIndex(index)] ?? 'center'

/**
 * `role="radiogroup"` with nine radios — ACCESSIBILITY.md § Inspector requires arrow navigation, and the
 * radio pattern is the one where selection follows focus, which is what a 3×3 alignment picker wants.
 */
function AlignFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  className,
}: AlignFieldProps): ReactElement {
  const settle = (next: AlignValue): void => {
    onChange(next)
    onCommit(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = STEP[event.key]

    if (step === undefined) {
      return
    }

    event.preventDefault()
    const [dx, dy] = step

    settle({
      horizontal: axisAt(AXIS.indexOf(value.horizontal) + dx),
      vertical: axisAt(AXIS.indexOf(value.vertical) + dy),
    })
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-describedby={describedBy}
      aria-disabled={disabled || undefined}
      className={cn(alignFieldStyles(), className)}
      onKeyDown={onKeyDown}
      {...controlLabelProps(label, labelledBy)}
    >
      {AXIS.map((vertical) =>
        AXIS.map((horizontal) => {
          const selected = value.horizontal === horizontal && value.vertical === vertical

          return (
            <button
              key={`${vertical}-${horizontal}`}
              type="button"
              // biome-ignore lint/a11y/useSemanticElements: `input[type=radio]` cannot hold the dot glyph, and nine of them would each need a wrapping label.
              role="radio"
              aria-checked={selected}
              aria-label={NAMES[vertical][horizontal]}
              disabled={disabled}
              // Roving tabindex: one stop per group, arrows navigate inside — UI_GUIDELINES § Focus.
              tabIndex={selected ? 0 : -1}
              className={alignCellStyles({ selected })}
              onClick={() => settle({ horizontal, vertical })}
            >
              <span className={alignDotStyles()} />
            </button>
          )
        }),
      )}
    </div>
  )
}

export const AlignField = memo(AlignFieldImpl)
