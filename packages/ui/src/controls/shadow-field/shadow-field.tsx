import { PlusIcon } from '@motion-studio/icons'
import { cn, insertAt, move, removeAt } from '@motion-studio/utils'
import { type ReactElement, memo, useState } from 'react'

import { Button } from '../../button/index'
import { EmptyState } from '../../empty-state/index'
import { controlLabelProps, useRowDrag } from '../control-row/index'
import { ShadowLayerEditor } from './shadow-layer-editor'
import { ShadowLayerRow } from './shadow-layer-row'

import type { ShadowFieldProps, ShadowLayer } from './shadow-field.types'

/** `DESIGN_SYSTEM.md` § Elevation layers a contact shadow under an ambient one; six is room for both plus. */
const DEFAULT_MAX = 6

const NEW_LAYER: ShadowLayer = {
  x: 0,
  y: 2,
  blur: 4,
  spread: 0,
  color: 'oklch(0% 0 0 / 0.1)',
  inset: false,
}

function ShadowFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  max = DEFAULT_MAX,
  tokens,
  className,
}: ShadowFieldProps): ReactElement {
  const [selected, setSelected] = useState(0)
  const active = Math.min(selected, Math.max(0, value.length - 1))
  const layer = value[active]

  const emit = (next: readonly ShadowLayer[], commit: boolean): void => {
    onChange(next)

    if (commit) {
      onCommit(next)
    }
  }

  const reorder = (from: number, to: number, commit: boolean): void => {
    setSelected(to)
    emit(move(value, from, to), commit)
  }

  const { gripProps, draggingIndex } = useRowDrag({
    count: value.length,
    onReorder: (from, to) => reorder(from, to, false),
    onDrop: () => onCommit(value),
  })

  return (
    <div
      id={id}
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={describedBy}
      className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}
      {...controlLabelProps(label, labelledBy)}
    >
      {value.length === 0 ? (
        <EmptyState message="No shadow" />
      ) : (
        <ul className="flex flex-col gap-0.5">
          {value.map((entry, index) => (
            <ShadowLayerRow
              key={`${index}-${entry.color}`}
              layer={entry}
              index={index}
              count={value.length}
              selected={index === active || index === draggingIndex}
              disabled={disabled}
              gripProps={gripProps(index)}
              onSelect={() => setSelected(index)}
              onMove={(to) => reorder(index, to, true)}
              onRemove={() => {
                setSelected(Math.max(0, index - 1))
                emit(removeAt(value, index), true)
              }}
            />
          ))}
        </ul>
      )}

      {layer === undefined ? null : (
        <ShadowLayerEditor
          layer={layer}
          index={active}
          disabled={disabled}
          tokens={tokens}
          onEdit={(next, commit) =>
            emit(
              value.map((entry, index) => (index === active ? next : entry)),
              commit,
            )
          }
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        aria-label={`Add a ${label.toLowerCase()} layer`}
        disabled={disabled || value.length >= max}
        onClick={() => {
          setSelected(value.length)
          emit(insertAt(value, value.length, NEW_LAYER), true)
        }}
      >
        <PlusIcon size={12} />
        Add layer
      </Button>
    </div>
  )
}

export const ShadowField = memo(ShadowFieldImpl)
