import { cn } from '@motion-studio/utils'
import { type ReactElement, memo } from 'react'

import { controlLabelProps } from '../control-row/index'
import { SliderField } from '../slider-field/index'
import { OVERSHOOT_CEILING, settleMs, springPolyline } from './spring-curve'

import type { SpringEditorProps, SpringValue } from './spring-editor.types'

const BOX = { width: 200, height: 100 } as const

/** `ANIMATION_SYSTEM.md` § Springs: the catalogue spans these, and a value outside them is not a spring. */
const CHANNELS = [
  { key: 'stiffness', label: 'Stiffness', min: 20, max: 600, step: 5 },
  { key: 'damping', label: 'Damping', min: 1, max: 60, step: 1 },
  { key: 'mass', label: 'Mass', min: 0.1, max: 5, step: 0.1 },
] as const

/**
 * Three numbers and the curve they produce, integrated by `simulateSpring` — prompt 09 § SpringEditor.
 *
 * Drawn as SVG rather than to a canvas, for the reason ADR-046 records: it stays crisp at 200 % zoom and
 * needs no native canvas dependency to be rendered or tested.
 */
function SpringEditorImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  className,
}: SpringEditorProps): ReactElement {
  const settle = settleMs(value)
  const summary = settle === null ? 'Does not settle within two seconds' : `Settles in ${settle} ms`

  const edit = (next: SpringValue, commit: boolean): void => {
    onChange(next)

    if (commit) {
      onCommit(next)
    }
  }

  return (
    <div
      id={id}
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={describedBy}
      className={cn('flex min-w-0 flex-1 flex-col gap-1.5', className)}
      {...controlLabelProps(label, labelledBy)}
    >
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        aria-hidden
        className="h-[100px] w-full rounded-sm border border-border bg-surface-2"
      >
        <title>{summary}</title>
        {/* Rest, and the ceiling the vertical range is fixed to. */}
        <line
          x1={0}
          y1={BOX.height - BOX.height / OVERSHOOT_CEILING}
          x2={BOX.width}
          y2={BOX.height - BOX.height / OVERSHOOT_CEILING}
          className="stroke-border"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
        <polyline
          points={springPolyline(value, BOX.width, BOX.height)}
          fill="none"
          className="stroke-foreground"
          strokeWidth={2}
        />
      </svg>

      {CHANNELS.map((channel) => (
        <SliderField
          key={channel.key}
          label={`${label} ${channel.label.toLowerCase()}`}
          value={value[channel.key]}
          min={channel.min}
          max={channel.max}
          step={channel.step}
          disabled={disabled}
          onChange={(next) => edit({ ...value, [channel.key]: next }, false)}
          onCommit={(next) => edit({ ...value, [channel.key]: next }, true)}
        />
      ))}

      <output className="text-2xs text-foreground-muted">{summary}</output>
    </div>
  )
}

export const SpringEditor = memo(SpringEditorImpl)
