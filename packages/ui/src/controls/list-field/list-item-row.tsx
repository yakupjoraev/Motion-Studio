import { ChevronDownIcon, ChevronUpIcon, DeleteIcon, MoveIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import type { ReactElement, ReactNode } from 'react'

import { Button } from '../../button/index'

import type { RowDragProps } from '../control-row/index'

export interface ListItemRowProps {
  readonly label: string
  readonly index: number
  readonly count: number
  readonly open: boolean
  readonly sortable: boolean
  readonly disabled: boolean
  readonly children: ReactNode
  readonly gripProps: RowDragProps
  readonly onToggle: () => void
  readonly onMove: (to: number) => void
  readonly onRemove: () => void
}

/**
 * One repeatable item: a header that collapses, the caller's sub-controls beneath it, and the reorder
 * buttons § Inspector requires alongside the grip.
 */
export function ListItemRow({
  label,
  index,
  count,
  open,
  sortable,
  disabled,
  children,
  gripProps,
  onToggle,
  onMove,
  onRemove,
}: ListItemRowProps): ReactElement {
  const position = index + 1
  const bodyId = `list-item-${position}-body`

  return (
    <li className="rounded-sm border border-border">
      <div className="flex items-center gap-1 px-1">
        {sortable ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Drag ${label}`}
            disabled={disabled}
            className="cursor-grab"
            {...gripProps}
          >
            <MoveIcon size={12} />
          </Button>
        ) : null}

        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          disabled={disabled}
          className="min-w-0 flex-1 truncate py-1 text-left text-xs outline-none focus-visible:shadow-focus"
          onClick={onToggle}
        >
          {label}
        </button>

        {sortable ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Move ${label} up`}
              disabled={disabled || index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ChevronUpIcon size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Move ${label} down`}
              disabled={disabled || index === count - 1}
              onClick={() => onMove(index + 1)}
            >
              <ChevronDownIcon size={12} />
            </Button>
          </>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${label}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <DeleteIcon size={12} />
        </Button>
      </div>

      <div id={bodyId} className={cn('flex flex-col gap-1 px-1 pb-1', !open && 'hidden')}>
        {children}
      </div>
    </li>
  )
}
