import { DeleteIcon, PlusIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useState } from 'react'

import { Button } from '../../button/index'
import { ColorField } from '../color-field/index'
import { controlLabelProps } from '../control-row/index'
import { ScrubField } from '../scrub-field/index'
import { SegmentedField } from '../segmented-field/index'
import { toCss } from './gradient-css'
import { GradientGeometry } from './gradient-geometry'
import { convertKind, stopsOf, withStops } from './gradient-kind'
import { GradientStops } from './gradient-stops'
import { MIN_STOPS, addStop, moveStop, removeStop, setStopColor } from './stop-list'

import type { Gradient } from '@motion-studio/tokens'
import type { GradientFieldProps, StopGradientKind } from './gradient-field.types'
import type { StopEdit } from './stop-list'

const ALL_KINDS: readonly StopGradientKind[] = ['linear', 'radial', 'conic']

const KIND_LABEL: Readonly<Record<StopGradientKind, string>> = {
  linear: 'Linear',
  radial: 'Radial',
  conic: 'Conic',
}

function GradientFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  kinds = ALL_KINDS,
  tokens,
  className,
}: GradientFieldProps): ReactElement {
  const [selected, setSelected] = useState(0)
  const stops = stopsOf(value)
  const active = Math.min(selected, Math.max(0, stops.length - 1))
  const stop = stops[active]

  const emit = (next: Gradient, commit: boolean): void => {
    onChange(next)

    if (commit) {
      onCommit(next)
    }
  }

  const editStops = (edit: StopEdit, commit: boolean): void => {
    setSelected(edit.selected)
    emit(withStops(value, edit.stops), commit)
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
      <SegmentedField
        label={`${label} kind`}
        value={value.kind}
        options={kinds.map((kind) => ({
          value: kind,
          content: KIND_LABEL[kind],
          label: KIND_LABEL[kind],
        }))}
        disabled={disabled || value.kind === 'mesh'}
        onChange={() => undefined}
        onCommit={(kind) => {
          const next = kinds.find((entry) => entry === kind)

          if (next !== undefined) {
            emit(convertKind(value, next), true)
          }
        }}
      />

      {value.kind === 'mesh' ? (
        <>
          <span
            aria-hidden
            className="h-[20px] w-full rounded-sm border border-border"
            style={{ backgroundImage: toCss(value), filter: `blur(${value.blur}px)` }}
          />
          <p className="text-2xs text-foreground-subtle">
            A mesh gradient is chosen as a preset. Switch to a stop-based kind to edit it here.
          </p>
        </>
      ) : (
        <>
          <GradientStops
            stops={stops}
            selected={active}
            label={label}
            disabled={disabled}
            preview={toCss(value)}
            onSelect={setSelected}
            onMove={(index, position, commit) =>
              editStops(moveStop(stops, index, position), commit)
            }
          />

          <GradientGeometry
            value={value}
            label={label}
            disabled={disabled}
            onEdit={(next, commit) => emit(next, commit)}
          />

          {stop === undefined ? null : (
            <span className="flex items-center gap-1">
              <ColorField
                label={`${label} stop ${active + 1} colour`}
                value={{ kind: 'color', color: stop.color }}
                tokens={tokens}
                alpha
                disabled={disabled}
                onChange={(next) =>
                  editStops(
                    setStopColor(stops, active, next.kind === 'color' ? next.color : stop.color),
                    false,
                  )
                }
                onCommit={(next) =>
                  editStops(
                    setStopColor(stops, active, next.kind === 'color' ? next.color : stop.color),
                    true,
                  )
                }
              />
              <ScrubField
                label={`${label} stop ${active + 1} position`}
                value={stop.position}
                min={0}
                max={100}
                unit="%"
                disabled={disabled}
                className="w-[56px] shrink-0"
                onChange={(position) => editStops(moveStop(stops, active, position), false)}
                onCommit={(position) => editStops(moveStop(stops, active, position), true)}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Add a stop after stop ${active + 1}`}
                disabled={disabled}
                onClick={() => editStops(addStop(stops, active), true)}
              >
                <PlusIcon size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete stop ${active + 1}`}
                disabled={disabled || stops.length <= MIN_STOPS}
                onClick={() => editStops(removeStop(stops, active), true)}
              >
                <DeleteIcon size={12} />
              </Button>
            </span>
          )}
        </>
      )}
    </div>
  )
}

export const GradientField = memo(GradientFieldImpl)
