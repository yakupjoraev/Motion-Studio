import { commands } from '@motion-studio/editor'
import {
  type BlockDefinition,
  type BlockId,
  type BlockRegistry,
  type BreakpointId,
  type MotionDocument,
  type Node,
  type NodeId,
  type SlotDefinition,
  type SlotOrientation,
  type UnknownProps,
  isDescendant,
  resolveResponsiveProps,
} from '@motion-studio/schema'
import type { Point, Rect } from '@motion-studio/utils'

import type { DragRectSource, DropTarget } from './dnd.types'
import { type PlacementChild, placeInSlot } from './drop-placement'
import { validateDrop } from './validate-drop'

export interface ResolveDropTargetArgs {
  /**
   * Screen coordinates, the space both the pointer and the rect cache are in — ADR-126 is why there
   * is no canvas conversion on this path.
   */
  readonly point: Point
  /** The deepest node under the pointer, from the caller's own hit test. */
  readonly hitNodeId: NodeId | null
  readonly draggedBlockId: BlockId
  /** Empty for a palette drag. */
  readonly draggedNodeIds: readonly NodeId[]
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly rects: DragRectSource
  readonly isolationId: NodeId | null
  /** Step 4 reads the container's resolved props, and resolving them needs the breakpoint. */
  readonly breakpoint: BreakpointId
}

/**
 * DRAG_AND_DROP.md § Drop position resolution — the seven steps, as one pure function. No DOM, no
 * store: the hit test happened in the caller, the rects were measured once at drag start, and the
 * document and registry come in. That separation is the point, and it is what lets every case in the
 * table be a unit test.
 */
export function resolveDropTarget(args: ResolveDropTargetArgs): DropTarget | null {
  const dragged = args.registry.get(args.draggedBlockId)

  if (dragged === undefined) {
    return null
  }

  const found = findSlot(args, dragged)

  if (found === null) {
    return null
  }

  const { parent, slot } = found
  const verdict = validateDrop({
    document: args.document,
    registry: args.registry,
    parent,
    slot,
    dragged,
    draggedNodeIds: args.draggedNodeIds,
  })
  const container = args.rects.get(parent.id)

  if (!verdict.ok) {
    return {
      parentId: parent.id,
      slot: slot.name,
      index: 0,
      orientation: orientationOf(parent, slot, args.breakpoint),
      indicator: { kind: 'reject', rect: container ?? EMPTY, reason: verdict.reason },
    }
  }

  const orientation = orientationOf(parent, slot, args.breakpoint)
  const siblings = placementChildren(args, parent, slot.name)
  const { position, indicator } = placeInSlot({
    orientation,
    point: args.point,
    container: container ?? EMPTY,
    children: siblings,
  })

  return {
    parentId: parent.id,
    slot: slot.name,
    index: childrenIndex(args, parent, siblings, position),
    orientation,
    indicator,
  }
}

const EMPTY: Rect = { x: 0, y: 0, width: 0, height: 0 }

interface Found {
  readonly parent: Node
  readonly slot: SlotDefinition
  /** The child the walk came up through, whose own slot is the one a drop should prefer. */
  readonly child: Node | undefined
}

/**
 * Steps 2 and 3. The walk stops at the first ancestor with a slot that *accepts* the block; whether
 * that ancestor then allows the drop is `validateDrop`'s answer, and a locked parent has to be
 * reported rather than walked past — silently landing two levels up is how a builder loses a user's
 * trust.
 *
 * Isolation is a ceiling and a floor: the walk starts inside the isolated subtree and never leaves it.
 */
function findSlot(args: ResolveDropTargetArgs, dragged: BlockDefinition): Found | null {
  const { document } = args
  const ceiling = args.isolationId ?? document.rootId
  let current: Node | undefined = startNode(args, ceiling)
  let child: Node | undefined

  while (current !== undefined) {
    const slot = acceptingSlot(args, current, dragged, child?.slot)

    if (slot !== undefined) {
      return { parent: current, slot, child }
    }

    if (current.id === ceiling) {
      break
    }

    child = current
    current = current.parentId === null ? undefined : document.nodes[current.parentId]
  }

  const top = document.nodes[ceiling]

  return top === undefined ? null : rootFallback(args, top)
}

/** Where the walk begins: the hit node when it is inside the isolated subtree, else the ceiling. */
function startNode(args: ResolveDropTargetArgs, ceiling: NodeId): Node | undefined {
  const { document } = args
  const hit = args.hitNodeId === null ? undefined : document.nodes[args.hitNodeId]

  if (hit === undefined) {
    return document.nodes[ceiling]
  }

  const inside = hit.id === ceiling || isDescendant(document, hit.id, ceiling)

  return inside ? hit : document.nodes[ceiling]
}

function acceptingSlot(
  args: ResolveDropTargetArgs,
  parent: Node,
  dragged: BlockDefinition,
  preferred: string | undefined,
): SlotDefinition | undefined {
  const definition = args.registry.get(parent.blockId)

  if (definition === undefined) {
    return undefined
  }

  const ordered =
    preferred === undefined
      ? definition.slots
      : [
          ...definition.slots.filter((slot) => slot.name === preferred),
          ...definition.slots.filter((slot) => slot.name !== preferred),
        ]

  return ordered.find((slot) => commands.slotAccepts(slot, dragged))
}

/**
 * Step 3's second half: nothing accepted the block on the way up, so the answer is the ceiling with
 * the reason its first slot gives — a rejection the user can read beats a drag that does nothing.
 */
function rootFallback(args: ResolveDropTargetArgs, top: Node): Found | null {
  const definition = args.registry.get(top.blockId)
  const slot = definition?.slots[0]

  return slot === undefined ? null : { parent: top, slot, child: undefined }
}

function orientationOf(
  parent: Node,
  slot: SlotDefinition,
  breakpoint: BreakpointId,
): SlotOrientation {
  if (slot.orientation === undefined) {
    return 'vertical'
  }

  return slot.orientation(resolveResponsiveProps<UnknownProps>(parent, breakpoint))
}

/** The slot's children, in document order, dragged nodes excluded, unmeasured ones dropped. */
function placementChildren(
  args: ResolveDropTargetArgs,
  parent: Node,
  slot: string,
): readonly PlacementChild[] {
  return commands
    .slotChildren(args.document, parent, slot)
    .filter((id) => !args.draggedNodeIds.includes(id))
    .flatMap((id) => {
      const rect = args.rects.get(id)

      return rect === undefined ? [] : [{ id, rect }]
    })
}

/**
 * `DropTarget.index` is a position in the parent's `children`, which spans every slot — and with the
 * dragged nodes taken out, because `moveNodes` detaches before it splices. Moving a node one place
 * down its own list is the off-by-one this converts correctly.
 */
function childrenIndex(
  args: ResolveDropTargetArgs,
  parent: Node,
  siblings: readonly PlacementChild[],
  position: number,
): number {
  const list = parent.children.filter((id) => !args.draggedNodeIds.includes(id))
  const before = siblings[position - 1]

  if (before === undefined) {
    const first = siblings[0]

    return first === undefined ? list.length : list.indexOf(first.id)
  }

  return list.indexOf(before.id) + 1
}
