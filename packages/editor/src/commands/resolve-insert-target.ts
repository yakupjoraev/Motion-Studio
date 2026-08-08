import type {
  BlockDefinition,
  BlockId,
  BlockRegistry,
  MotionDocument,
  Node,
  NodeId,
  SlotDefinition,
} from '@motion-studio/schema'

import { slotAccepts, slotChildren, slotHasRoom } from './guards'

export interface InsertTarget {
  readonly parentId: NodeId
  readonly slot: string
  /** Position in the parent's `children`, which spans every slot. */
  readonly index: number
}

export interface InsertTargetRejection {
  readonly rejected: string
}

export interface ResolveInsertTargetArgs {
  readonly document: MotionDocument
  readonly selectionIds: readonly NodeId[]
  readonly isolationId: NodeId | null
  readonly blockId: BlockId
  readonly registry: BlockRegistry
}

/** Where the walk starts and which child it lands after — `null` means "at the end". */
interface Anchor {
  readonly parentId: NodeId
  readonly after: NodeId | null
  readonly slot: string | undefined
}

/**
 * A slot is a candidate only when the insert that follows would succeed: ADR-070 sorts the guards of
 * EDITOR_ENGINE.md § insertNode into the ones this decides (acceptance, capacity, the lock) and the
 * ones the caller's payload decides.
 */
function candidateSlot(
  document: MotionDocument,
  registry: BlockRegistry,
  parent: Node,
  child: BlockDefinition,
  preferred: string | undefined,
): SlotDefinition | undefined {
  if (parent.locked) {
    return undefined
  }

  const definition = registry.get(parent.blockId)

  if (definition === undefined) {
    return undefined
  }

  const preferredSlot =
    preferred === undefined ? undefined : definition.slots.find((slot) => slot.name === preferred)

  const ordered =
    preferredSlot === undefined
      ? definition.slots
      : [preferredSlot, ...definition.slots.filter((slot) => slot !== preferredSlot)]

  return ordered.find(
    (slot) =>
      slotAccepts(slot, child) &&
      slotHasRoom(slot, slotChildren(document, parent, slot.name).length, 1),
  )
}

function anchorOf(args: ResolveInsertTargetArgs): Anchor {
  const { document } = args
  const isolated = args.isolationId === null ? undefined : document.nodes[args.isolationId]

  if (isolated !== undefined) {
    return { parentId: isolated.id, after: null, slot: undefined }
  }

  const lastSelected = args.selectionIds.at(-1)
  const selected = lastSelected === undefined ? undefined : document.nodes[lastSelected]

  // A selected root has no parent to insert beside, which is the same position as no selection.
  if (selected !== undefined && selected.parentId !== null) {
    return { parentId: selected.parentId, after: selected.id, slot: selected.slot }
  }

  return { parentId: document.rootId, after: null, slot: undefined }
}

/**
 * The one implementation of "where does a new block land". Paste, the block palette (prompt 37) and
 * the command palette's insert action all resolve through it, so the three cannot drift.
 *
 * Order, from prompt 16: the isolated container, else the selection's parent after the selection,
 * else the root — and from wherever that lands, up through the ancestors until a slot takes the
 * block. Walking up is what makes pasting a heading beside a selected heading work.
 */
export function resolveInsertTarget(
  args: ResolveInsertTargetArgs,
): InsertTarget | InsertTargetRejection {
  const { document, registry } = args
  const child = registry.get(args.blockId)

  if (child === undefined) {
    return { rejected: `${args.blockId} is not a block in this registry` }
  }

  const anchor = anchorOf(args)
  let parentId: NodeId | null = anchor.parentId
  let after = anchor.after
  let preferred = anchor.slot

  while (parentId !== null) {
    const parent: Node | undefined = document.nodes[parentId]

    if (parent === undefined) {
      break
    }

    const slot = candidateSlot(document, registry, parent, child, preferred)

    if (slot !== undefined) {
      const index = after === null ? parent.children.length : parent.children.indexOf(after) + 1

      return { parentId: parent.id, slot: slot.name, index }
    }

    // One level up, landing after the branch the walk came out of.
    after = parent.id
    parentId = parent.parentId
    preferred = undefined
  }

  return { rejected: `Nothing here accepts ${child.name}` }
}
