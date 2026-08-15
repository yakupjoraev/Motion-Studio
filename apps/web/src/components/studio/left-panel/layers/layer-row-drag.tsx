'use client'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { useDraggableNode, useDropZone } from '@motion-studio/dnd'
import { selectors } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import { type KeyboardEvent, useEffect, useMemo } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import type { LayerSpan } from './layer-rects'
import { LayerRow, type LayerRowProps } from './layer-row'
import type { LayerRowView } from './use-flat-layers'

export type LayerRowHandlers = Pick<
  LayerRowProps,
  | 'onSelect'
  | 'onToggle'
  | 'onRenameStart'
  | 'onRenameCommit'
  | 'onRenameCancel'
  | 'onVisibility'
  | 'onLock'
>

export interface LayerRowDragProps extends LayerRowHandlers {
  readonly row: LayerRowView
  readonly focused: boolean
  readonly renaming: boolean
  readonly offset: number
  /** ADR-133's strip, or `null` for a block that holds no children and so is no drop zone. */
  readonly span: LayerSpan | null
  /** The tree hears which row is in flight: auto-scroll and spring-open run only during a drag. */
  readonly onDragChange: (id: NodeId | null) => void
}

const NO_CHILDREN: readonly NodeId[] = []

/**
 * Operations 3 and 4 of DRAG_AND_DROP.md § The four operations, at one row: the row is a drag source
 * for itself — or for the whole selection when it is part of it — and, when its block holds children,
 * a drop zone whose element covers exactly the strip ADR-133 gives it.
 */
export function LayerRowDrag({ row, span, onDragChange, ...rest }: LayerRowDragProps) {
  const selection = useStudioStore(selectors.selectSelectionIds)
  const children = useStudioStore((state) => state.document.nodes[row.id]?.children ?? NO_CHILDREN)

  const dragged = useMemo(
    () => (selection.includes(row.id) ? selection : [row.id]),
    [row.id, selection],
  )
  // Read once rather than subscribed: a name that changes mid-drag is not a case, and subscribing
  // every row to the document is the re-render PERFORMANCE.md § Selector discipline forbids.
  const labels = useMemo(
    () => dragged.map((id) => useStudioStore.getState().document.nodes[id]?.name ?? id),
    [dragged],
  )

  const drag = useDraggableNode({
    nodeId: row.id,
    blockId: row.blockId,
    nodeIds: dragged,
    labels,
    // The root is the document; a locked layer is one the user pinned down. Neither moves.
    disabled: row.locked || row.parentId === null,
  })

  const slot = blockRegistry.get(row.blockId)?.slots[0]
  const zone = useDropZone({
    parentId: row.id,
    slot: slot?.name ?? '',
    orientation: 'vertical',
    label: row.name,
    childIds: children,
    disabled: slot === undefined,
  })

  useEffect(() => {
    if (!drag.isDragging) {
      return
    }

    onDragChange(row.id)

    return () => onDragChange(null)
  }, [drag.isDragging, onDragChange, row.id])

  // ADR-136: `Space` belongs to the tree's own map, so it never reaches dnd-kit's activator. `Enter`
  // still does, and it is what picks a row up.
  const listeners = useMemo(() => {
    const source = drag.listeners

    if (source === undefined) {
      return undefined
    }

    return {
      ...source,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === ' ' || event.key === 'Spacebar') {
          return
        }

        source['onKeyDown']?.(event)
      },
    }
  }, [drag.listeners])

  return (
    <>
      <LayerRow drag={{ ...drag, listeners }} row={row} {...rest} />
      {span === null || slot === undefined ? null : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 w-full"
          ref={zone.ref}
          style={{ top: `${span.top}px`, height: `${span.height}px` }}
        />
      )}
    </>
  )
}
