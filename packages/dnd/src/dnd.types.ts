import type { BlockId, NodeId } from '@motion-studio/schema'
import type { Point, Rect } from '@motion-studio/utils'

/** DRAG_AND_DROP.md § The four operations. A drag either inserts a block or moves nodes. */
export type DragPayload =
  | {
      readonly kind: 'palette-block'
      readonly blockId: BlockId
      readonly label: string
    }
  | {
      readonly kind: 'canvas-nodes'
      readonly blockId: BlockId
      readonly nodeIds: readonly NodeId[]
      readonly labels: readonly string[]
    }

export type DropOrientation = 'vertical' | 'horizontal' | 'grid'

/**
 * Which surface drew the zone — ADR-181. The canvas and the layers tree both register a zone per
 * node, under the same node id and with different geometry, so the surface is what tells the two
 * apart: the tree's rect is the strip of ADR-133, the canvas's is the node's own box.
 */
export type DropSurface = 'canvas' | 'tree'

/**
 * What a container tells the drag layer about itself. `childIds` is what an insertion index is
 * counted against, and it comes from the document rather than from the DOM.
 */
export type DropZone = {
  readonly parentId: NodeId
  readonly slot: string
  readonly orientation: DropOrientation
  readonly label: string
  readonly childIds: readonly NodeId[]
  readonly surface: DropSurface
}

export type DropIndicator =
  | { readonly kind: 'line'; readonly rect: Rect; readonly axis: 'x' | 'y' }
  | { readonly kind: 'fill'; readonly rect: Rect }
  | { readonly kind: 'cell'; readonly rect: Rect }
  | { readonly kind: 'reject'; readonly rect: Rect; readonly reason: string }

export interface DropTarget {
  readonly parentId: NodeId
  readonly slot: string
  readonly index: number
  readonly orientation: DropOrientation
  readonly indicator: DropIndicator
}

/**
 * The rect cache of `packages/canvas`, narrowed to the one question a collision asks it.
 * ARCHITECTURE.md § Rules 8: `dnd` must not import `canvas`, so the cache arrives as a prop and
 * `check:deps` keeps it that way.
 */
export interface DragRectSource {
  get(id: NodeId): Rect | undefined
}

/**
 * The same question, asked about a zone rather than a node — ADR-181. The collision cannot use
 * `DragRectSource` directly any more: two surfaces hold a rect for one node id, and only the zone
 * says which of them is being pointed at.
 */
export interface ZoneRectSource {
  get(zone: DropZone): Rect | undefined
}

/** Screen coordinates, because that is the space both the pointer and the rect cache are in. */
export interface DropAttempt {
  readonly payload: DragPayload
  readonly zone: DropZone
  readonly point: Point
}

/**
 * Where a drop would land. The implementation is `resolveDropTarget` — a pure function of the
 * document, the registry and the rect cache, none of which this package owns.
 */
export type DropTargetResolver = (attempt: DropAttempt) => DropTarget | null
