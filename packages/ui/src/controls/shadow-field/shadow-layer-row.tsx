import { ChevronDownIcon, ChevronUpIcon, DeleteIcon, MoveIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import type { ReactElement } from 'react'

import { Button } from '../../button/index'
import { toCss } from './shadow-css'

import type { RowDragProps } from '../control-row/index'
import type { ShadowLayer } from './shadow-field.types'

export interface ShadowLayerRowProps {
  readonly layer: ShadowLayer
  readonly index: number
  readonly count: number
  readonly selected: boolean
  readonly disabled: boolean
  readonly onSelect: () => void
  readonly onMove: (to: number) => void
  readonly onRemove: () => void
  readonly gripProps: RowDragProps
}

/**
 * One layer in the stack. The two arrow buttons are the reorder path that matters — § Inspector:
 * "drag-only reordering is not accessible" — and they carry the labels it asks for by name.
 */
export function ShadowLayerRow({
  layer,
  index,
  count,
  selected,
  disabled,
  onSelect,
  onMove,
  onRemove,
  gripProps,
}: ShadowLayerRowProps): ReactElement {
  const position = index + 1

  return (
    <li className={cn('flex items-center gap-1 rounded-sm px-1', selected && 'bg-surface-2')}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Drag shadow ${position}`}
        disabled={disabled}
        className="cursor-grab"
        {...gripProps}
      >
        <MoveIcon size={12} />
      </Button>

      <button
        type="button"
        aria-label={`Edit shadow ${position}`}
        aria-pressed={selected}
        disabled={disabled}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none focus-visible:shadow-focus"
        onClick={onSelect}
      >
        <span
          aria-hidden
          className="h-[14px] w-[14px] shrink-0 rounded-sm border border-border bg-surface-1"
          style={{ boxShadow: toCss([layer]) }}
        />
        <span className="truncate text-2xs text-foreground-muted">{toCss([layer])}</span>
      </button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Move shadow ${position} up`}
        disabled={disabled || index === 0}
        onClick={() => onMove(index - 1)}
      >
        <ChevronUpIcon size={12} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Move shadow ${position} down`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index + 1)}
      >
        <ChevronDownIcon size={12} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete shadow ${position}`}
        disabled={disabled}
        onClick={onRemove}
      >
        <DeleteIcon size={12} />
      </Button>
    </li>
  )
}
