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
 * What a container tells the drag layer about itself. `childIds` is what an insertion index is
 * counted against, and it comes from the document rather than from the DOM.
 */
export type DropZone = {
  readonly parentId: NodeId
  readonly slot: string
  readonly orientation: DropOrientation
  readonly label: string
  readonly childIds: readonly NodeId[]
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
