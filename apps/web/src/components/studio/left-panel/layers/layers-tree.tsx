'use client'

import { useAutoScroll, useSpringOpen } from '@motion-studio/dnd'
import { type SelectionMode, commands, selectors } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import { DENSITY } from '@motion-studio/ui'
import type { Point } from '@motion-studio/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import { layerRects, subtreeSpans } from './layer-rects'
import { LayerRowDrag } from './layer-row-drag'
import type { LayerRowView } from './use-flat-layers'
import { useLayerRename } from './use-layer-rename'
import { useTreeKeyboard } from './use-tree-keyboard'

export const LAYERS_TREE_ID = 'layers-tree'

export interface LayersTreeProps {
  readonly rows: readonly LayerRowView[]
  /** Folding is the panel's state — ADR-132. `subtree` is the `Alt+Click` variant. */
  readonly onFold: (id: NodeId, expanded: boolean, subtree: boolean) => void
}

/** Rows above and below the window, so a fast scroll never shows a gap. */
const OVERSCAN = 8

/**
 * PRODUCT.md § 2 and ACCESSIBILITY.md § Layers tree: a real `role="tree"` over a virtual window, which
 * is why `aria-setsize` and `aria-posinset` are on every row — they are the only thing telling a screen
 * reader that the twelve rendered rows are twelve of four hundred.
 */
export function LayersTree({ rows, onFold }: LayersTreeProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const [focusedId, setFocusedId] = useState<NodeId | null>(null)
  const [draggingId, setDraggingId] = useState<NodeId | null>(null)
  const [springTarget, setSpringTarget] = useState<NodeId | null>(null)
  const rename = useLayerRename()

  /** Which surface moved the selection last, so the two directions of the sync cannot chase each other. */
  const source = useRef<'tree' | 'elsewhere'>('elsewhere')
  const point = useRef<Point | null>(null)
  const latest = useRef(rows)

  latest.current = rows

  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => DENSITY.layerRow,
    getItemKey: (index) => rows[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: OVERSCAN,
  })

  /** Read inside callbacks that must not be rebuilt when the virtualizer's identity changes. */
  const virtualizerRef = useRef(virtualizer)

  virtualizerRef.current = virtualizer

  const spans = useMemo(() => subtreeSpans(rows), [rows])

  useEffect(() => {
    layerRects.set(spans, rows, scrollRef.current)
  }, [rows, spans])

  const focused = focusedId ?? rows[0]?.id ?? null

  const select = useCallback((ids: readonly NodeId[], mode: SelectionMode) => {
    source.current = 'tree'
    useStudioStore.getState().select(ids, mode)
  }, [])

  const focus = useCallback((id: NodeId) => {
    setFocusedId(id)

    const index = latest.current.findIndex((row) => row.id === id)

    if (index !== -1) {
      virtualizerRef.current.scrollToIndex(index)
    }
  }, [])

  // The canvas half of the sync. A selection the tree did not make scrolls its row into view and moves
  // the roving tabindex to it; one the tree made is already where the user is looking.
  const selectionIds = useStudioStore(selectors.selectSelectionIds)

  useEffect(() => {
    const [first] = selectionIds

    if (source.current === 'tree') {
      source.current = 'elsewhere'

      return
    }

    if (first === undefined) {
      return
    }

    const index = latest.current.findIndex((row) => row.id === first)

    if (index !== -1) {
      setFocusedId(first)
      virtualizerRef.current.scrollToIndex(index)
    }
  }, [selectionIds])

  // Focus follows the roving tabindex, but only while the user is already inside the tree: a canvas
  // click that scrolls a row into view must not take the keyboard away from the canvas.
  useEffect(() => {
    const tree = treeRef.current

    if (focused === null || tree === null || !tree.contains(document.activeElement)) {
      return
    }

    tree.querySelector<HTMLElement>(`[data-layer-row="${focused}"]`)?.focus()
  }, [focused])

  const onKeyDown = useTreeKeyboard({
    rows,
    focusedId: focused,
    dragging: draggingId !== null,
    focus,
    fold: (id, expanded) => onFold(id, expanded, false),
    rename: rename.begin,
    select,
  })

  // DRAG_AND_DROP.md § Auto-behaviours. The pointer is read from the window because the ghost sits
  // over the row the drag is above, so the row's own events stop arriving the moment it is picked up.
  useEffect(() => {
    if (draggingId === null) {
      return
    }

    const onPointerMove = (event: PointerEvent): void => {
      point.current = { x: event.clientX, y: event.clientY }

      const over = layerRects.rowAt(point.current)
      const row = latest.current.find((entry) => entry.id === over)

      setSpringTarget(row?.hasChildren && !row.expanded ? row.id : null)
    }

    window.addEventListener('pointermove', onPointerMove)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      setSpringTarget(null)
      point.current = null
    }
  }, [draggingId])

  useAutoScroll({ scrollRef, active: draggingId !== null, point: () => point.current })
  useSpringOpen({ over: springTarget, open: (id) => onFold(id, true, false) })

  const onSelect = useCallback(
    (row: LayerRowView, event: ReactPointerEvent) => {
      setFocusedId(row.id)
      select([row.id], mode(event))
    },
    [select],
  )

  /**
   * Focus can arrive without the tree moving it — a click, a `Tab`, a screen reader's own cursor —
   * and the roving tabindex has to follow it, or the next arrow press walks from the wrong row.
   */
  const onFocusCapture = useCallback((event: { target: EventTarget | null }) => {
    const element = event.target instanceof HTMLElement ? event.target : null
    const id = element?.closest('[data-layer-row]')?.getAttribute('data-layer-row') ?? null

    if (id !== null) {
      setFocusedId(latest.current.find((row) => row.id === id)?.id ?? null)
    }
  }, [])

  const onToggle = useCallback(
    (row: LayerRowView, subtree: boolean) => onFold(row.id, !row.expanded, subtree),
    [onFold],
  )

  const onVisibility = useCallback((row: LayerRowView) => {
    useStudioStore
      .getState()
      .dispatch(commands.setVisibility({ ids: [row.id], hidden: !row.hidden }))
  }, [])

  const onLock = useCallback((row: LayerRowView) => {
    useStudioStore.getState().dispatch(commands.setLocked({ ids: [row.id], locked: !row.locked }))
  }, [])

  return (
    <div className="h-full overflow-y-auto" data-testid="layers-scroll" ref={scrollRef}>
      <div
        aria-label="Layers"
        aria-multiselectable="true"
        className="relative w-full"
        id={LAYERS_TREE_ID}
        onFocusCapture={onFocusCapture}
        onKeyDown={onKeyDown}
        ref={treeRef}
        role="tree"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index]

          return row === undefined ? null : (
            <LayerRowDrag
              focused={row.id === focused}
              key={item.key}
              offset={item.start}
              onDragChange={setDraggingId}
              onLock={onLock}
              onRenameCancel={rename.cancel}
              onRenameCommit={rename.commit}
              onRenameStart={rename.begin}
              onSelect={onSelect}
              onToggle={onToggle}
              onVisibility={onVisibility}
              renaming={rename.editingId === row.id}
              row={row}
              span={spans.get(row.id) ?? null}
            />
          )
        })}
      </div>
    </div>
  )
}

/** SHORTCUTS.md § Selection, at a row: plain replaces, `Shift` takes the range, `Mod` toggles. */
const mode = (event: ReactPointerEvent): SelectionMode =>
  event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace'
