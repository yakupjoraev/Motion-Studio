import { PlusIcon } from '@motion-studio/icons'
import { cn, insertAt, move, removeAt } from '@motion-studio/utils'
import { type ReactElement, memo, useState } from 'react'

import { Button } from '../../button/index'
import { EmptyState } from '../../empty-state/index'
import { controlLabelProps, useRowDrag } from '../control-row/index'
import { ListItemRow } from './list-item-row'

import type { ListFieldProps } from './list-field.types'

function ListFieldImpl<T>({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  createItem,
  itemLabel,
  renderItem,
  max,
  sortable = true,
  className,
}: ListFieldProps<T>): ReactElement {
  /**
   * Collapse state travels with the item, not with its index: reordering must not open a different row
   * than the one that was open, which is the "reordering does not lose per-item state" the prompt asks
   * a test for.
   */
  const [open, setOpen] = useState<readonly boolean[]>(() => value.map(() => false))

  const emit = (items: readonly T[], flags: readonly boolean[], commit: boolean): void => {
    setOpen(flags)
    onChange(items)

    if (commit) {
      onCommit(items)
    }
  }

  const reorder = (from: number, to: number, commit: boolean): void => {
    emit(move(value, from, to), move(open, from, to), commit)
  }

  const { gripProps } = useRowDrag({
    count: value.length,
    onReorder: (from, to) => reorder(from, to, false),
    onDrop: () => onCommit(value),
  })

  const full = max !== undefined && value.length >= max

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
        <EmptyState message={`No ${label.toLowerCase()} yet`} />
      ) : (
        <ul className="flex flex-col gap-1">
          {value.map((item, index) => (
            <ListItemRow
              // Index is the identity here: the caller's items have no id, and a reorder moves the
              // collapse flags alongside them so the rows stay attached to their own state.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above — the parallel state moves with the item, so the index is stable for this list.
              key={index}
              label={itemLabel(item, index)}
              index={index}
              count={value.length}
              open={open[index] ?? false}
              sortable={sortable}
              disabled={disabled}
              gripProps={gripProps(index)}
              onToggle={() => setOpen(open.map((flag, at) => (at === index ? !flag : flag)))}
              onMove={(to) => reorder(index, to, true)}
              onRemove={() => emit(removeAt(value, index), removeAt(open, index), true)}
            >
              {renderItem(item, index, (next, commit) =>
                emit(
                  value.map((entry, at) => (at === index ? next : entry)),
                  open,
                  commit,
                ),
              )}
            </ListItemRow>
          ))}
        </ul>
      )}

      <Button
        variant="ghost"
        size="sm"
        aria-label={`Add ${label.toLowerCase()}`}
        disabled={disabled || full}
        onClick={() => emit(insertAt(value, value.length, createItem()), [...open, true], true)}
      >
        <PlusIcon size={12} />
        Add
      </Button>
    </div>
  )
}

/** `memo` erases the generic, so the parameter is restored on the exported binding. */
export const ListField = memo(ListFieldImpl) as typeof ListFieldImpl
