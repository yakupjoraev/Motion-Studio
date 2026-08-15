import type { DragRectSource } from '@motion-studio/dnd'
import type { NodeId } from '@motion-studio/schema'
import { DENSITY } from '@motion-studio/ui'
import type { Rect } from '@motion-studio/utils'

import type { LayerRowView } from './use-flat-layers'

/** A node's strip in the list's own coordinates: pixels from the top of the whole list. */
export interface LayerSpan {
  readonly top: number
  readonly height: number
}

export interface LayerRectSource extends DragRectSource {
  /** The tree publishes its rows and its scrolling element; the drag layer reads them as `rects`. */
  set(
    spans: ReadonlyMap<NodeId, LayerSpan>,
    rows: readonly LayerRowView[],
    viewport: HTMLElement | null,
  ): void
  /** The node whose row is under a screen point — what spring-open asks about. */
  rowAt(point: { readonly x: number; readonly y: number }): NodeId | null
}

/**
 * ADR-133. A node's rect in the tree is the strip its **descendants** occupy, or its own row when it
 * has none open — one pass over a pre-ordered list, because a subtree is the run of rows deeper than
 * the row that opens it.
 *
 * The tree gives every drop zone an element of exactly this size, so dnd-kit's measured rect — which
 * its keyboard sensor steps against — and the rects the collision reads here describe one geometry.
 */
export function subtreeSpans(rows: readonly LayerRowView[]): ReadonlyMap<NodeId, LayerSpan> {
  const end = new Array<number>(rows.length).fill(0)
  const open: number[] = []

  rows.forEach((row, at) => {
    while (open.length > 0) {
      const last = open[open.length - 1]

      if (last === undefined) {
        open.pop()

        continue
      }

      const parent = rows[last]

      if (parent === undefined || parent.depth < row.depth) {
        break
      }

      end[last] = at
      open.pop()
    }

    open.push(at)
  })

  for (const at of open) {
    end[at] = rows.length
  }

  const spans = new Map<NodeId, LayerSpan>()

  rows.forEach((row, at) => {
    const last = end[at] ?? at + 1
    const first = last > at + 1 ? at + 1 : at
    const bottom = last > at + 1 ? last : at + 1

    spans.set(row.id, {
      top: first * DENSITY.layerRow,
      height: (bottom - first) * DENSITY.layerRow,
    })
  })

  return spans
}

/**
 * The same spans in screen space, which is where the pointer and `resolveDropTarget` both are. One
 * box read per call and no per-row measurement: rows are a fixed height and the list gives the index.
 */
export function createLayerRectSource(): LayerRectSource {
  let spans: ReadonlyMap<NodeId, LayerSpan> = new Map()
  let rows: readonly LayerRowView[] = []
  let viewport: HTMLElement | null = null

  const geometry = (): { readonly box: DOMRect; readonly origin: number } | null => {
    if (viewport === null) {
      return null
    }

    const box = viewport.getBoundingClientRect()

    return { box, origin: box.top - viewport.scrollTop }
  }

  return {
    set(nextSpans, nextRows, element) {
      spans = nextSpans
      rows = nextRows
      viewport = element
    },

    get(id: NodeId): Rect | undefined {
      const span = spans.get(id)
      const measured = geometry()

      if (span === undefined || measured === null) {
        return undefined
      }

      // Clipped to the viewport, because a row scrolled out of it is not a place a pointer can be. A
      // row straddling an edge keeps only its visible part, which moves its midpoint — by then the
      // auto-scroll is already running towards it.
      const top = Math.max(measured.origin + span.top, measured.box.top)
      const bottom = Math.min(measured.origin + span.top + span.height, measured.box.bottom)

      return bottom <= top
        ? undefined
        : { x: measured.box.left, y: top, width: measured.box.width, height: bottom - top }
    },

    rowAt(point) {
      const measured = geometry()

      if (measured === null || !inside(measured.box, point)) {
        return null
      }

      const at = Math.floor((point.y - measured.origin) / DENSITY.layerRow)

      return rows[at]?.id ?? null
    },
  }
}

const inside = (box: DOMRect, point: { readonly x: number; readonly y: number }): boolean =>
  point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom

/**
 * One instance for the studio: the tree writes to it and `DndHost` — which is mounted above the tree
 * and so cannot receive a ref from it — reads it, the same seam `useStudioStore` is.
 */
export const layerRects = createLayerRectSource()
