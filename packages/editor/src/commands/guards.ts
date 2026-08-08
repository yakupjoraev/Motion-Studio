import type {
  BlockDefinition,
  BreakpointId,
  MotionDocument,
  Node,
  NodeId,
  SlotDefinition,
} from '@motion-studio/schema'
import { MotionStudioError, NodeNotFoundError } from '@motion-studio/utils'
import type { Draft } from 'immer'

/**
 * EDITOR_ENGINE.md § Structural commands and their guards. Every rejection in the catalogue reports
 * one of these, so a caller discriminates on `code` and a test names the guard it is exercising.
 */
export const COMMAND_CODES = {
  lockedNode: 'LOCKED_NODE',
  unknownSlot: 'UNKNOWN_SLOT',
  slotRejectsBlock: 'SLOT_REJECTS_BLOCK',
  slotFull: 'SLOT_FULL',
  rootProtected: 'ROOT_PROTECTED',
  mixedParents: 'MIXED_PARENTS',
  emptySelection: 'EMPTY_SELECTION',
  invalidProps: 'INVALID_PROPS',
  nodeIdTaken: 'NODE_ID_TAKEN',
  moveIntoDescendant: 'MOVE_INTO_DESCENDANT',
  recursiveDefaultChildren: 'RECURSIVE_DEFAULT_CHILDREN',
  responsivePathNotShallow: 'RESPONSIVE_PATH_NOT_SHALLOW',
  baseIsNotAnOverride: 'BASE_IS_NOT_AN_OVERRIDE',
  unsupportedMotionChannel: 'UNSUPPORTED_MOTION_CHANNEL',
  invalidMotionSpec: 'INVALID_MOTION_SPEC',
  invalidEffect: 'INVALID_EFFECT',
  effectNotFound: 'EFFECT_NOT_FOUND',
  effectStackFull: 'EFFECT_STACK_FULL',
  invalidName: 'INVALID_NAME',
  metaPathNotEditable: 'META_PATH_NOT_EDITABLE',
  invalidMeta: 'INVALID_META',
  crossAxisDistribute: 'CROSS_AXIS_DISTRIBUTE',
} as const

export type CommandCode = (typeof COMMAND_CODES)[keyof typeof COMMAND_CODES]

export const commandError = (
  code: CommandCode,
  message: string,
  cause?: unknown,
): MotionStudioError => new MotionStudioError(message, code, cause)

export function requireNode(draft: Draft<MotionDocument>, id: NodeId): Draft<Node> {
  const node = draft.nodes[id]

  if (node === undefined) {
    throw new NodeNotFoundError(id)
  }

  return node
}

export function requireUnlocked(node: Draft<Node>): void {
  if (node.locked) {
    throw commandError(COMMAND_CODES.lockedNode, `${node.name} is locked`)
  }
}

export function requireNotRoot(draft: Draft<MotionDocument>, id: NodeId): void {
  if (id === draft.rootId) {
    throw commandError(COMMAND_CODES.rootProtected, 'The root node cannot be removed or moved')
  }
}

/** An id the caller chose (ADR-061) must not already name a node — the write would replace one. */
export function requireFreshId(draft: Draft<MotionDocument>, id: NodeId): void {
  if (draft.nodes[id] !== undefined) {
    throw commandError(COMMAND_CODES.nodeIdTaken, `A node already exists with id ${id}`)
  }
}

export function requireSlot(definition: BlockDefinition, slot: string): SlotDefinition {
  const found = definition.slots.find((candidate) => candidate.name === slot)

  if (found === undefined) {
    throw commandError(COMMAND_CODES.unknownSlot, `${definition.name} has no slot named "${slot}"`)
  }

  return found
}

/** The predicate behind `requireAcceptance`, for the callers that choose a slot rather than assert one. */
export function slotAccepts(slot: SlotDefinition, child: BlockDefinition): boolean {
  const accepts = slot.accepts

  return accepts === '*'
    ? true
    : typeof accepts === 'function'
      ? accepts(child)
      : accepts.includes(child.id)
}

export function requireAcceptance(slot: SlotDefinition, child: BlockDefinition): void {
  if (!slotAccepts(slot, child)) {
    throw commandError(
      COMMAND_CODES.slotRejectsBlock,
      `Slot "${slot.name}" does not accept ${child.name}`,
    )
  }
}

/**
 * The ids already occupying a slot, which is what `maxChildren` counts. Typed against the readonly
 * document so a draft and a committed document both satisfy it — insertion targeting resolves against
 * the latter.
 */
export function slotChildren(
  document: MotionDocument,
  parent: Node,
  slot: string,
): readonly NodeId[] {
  return parent.children.filter((id) => document.nodes[id]?.slot === slot)
}

/** The predicate behind `requireCapacity`. `null` is an unbounded slot. */
export const slotHasRoom = (slot: SlotDefinition, occupied: number, incoming: number): boolean =>
  slot.maxChildren === null || occupied + incoming <= slot.maxChildren

/** `occupied` is passed rather than read, because a move counts the slot *after* the detach. */
export function requireCapacity(slot: SlotDefinition, occupied: number, incoming: number): void {
  const max = slot.maxChildren

  if (max === null) {
    return
  }

  if (!slotHasRoom(slot, occupied, incoming)) {
    throw commandError(
      COMMAND_CODES.slotFull,
      `Slot "${slot.name}" holds at most ${max} ${max === 1 ? 'child' : 'children'}`,
    )
  }
}

/** Types the emptiness away, so the callers below have no unreachable `undefined` arm to test. */
export function requireNonEmpty(ids: readonly NodeId[]): readonly [NodeId, ...NodeId[]] {
  const [first, ...rest] = ids

  if (first === undefined) {
    throw commandError(COMMAND_CODES.emptySelection, 'No nodes given')
  }

  return [first, ...rest]
}

/**
 * The shared guard behind `wrapInContainer`, `alignNodes` and `distributeNodes`. Returns the parent
 * every id agrees on, and rejects an empty selection and the root before that.
 */
export function requireSharedParent(
  draft: Draft<MotionDocument>,
  ids: readonly NodeId[],
): Draft<Node> {
  const [first] = requireNonEmpty(ids)

  const parentId = requireNode(draft, first).parentId

  if (parentId === null) {
    throw commandError(COMMAND_CODES.rootProtected, 'The root node has no parent to operate on')
  }

  for (const id of ids) {
    if (requireNode(draft, id).parentId !== parentId) {
      throw commandError(
        COMMAND_CODES.mixedParents,
        'All nodes must share one parent for this operation',
      )
    }
  }

  return requireNode(draft, parentId)
}

/**
 * Invariant 7 on the write path: a value the block's schema rejects never reaches the document.
 * Returns the parsed props, so schema defaults are applied on insert rather than on first read.
 */
export function requireProps(
  definition: BlockDefinition,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = definition.propsSchema.safeParse(props)

  if (!parsed.success) {
    throw commandError(
      COMMAND_CODES.invalidProps,
      `Invalid props for ${definition.name}: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
      parsed.error,
    )
  }

  return parsed.data
}

/**
 * ADR-058. `resolveResponsiveProps` merges one level, so an override is a top-level prop key and
 * `base` is not an override at all — it is `props`, which is what `setProp` writes.
 */
export function requireOverrideKey(breakpoint: BreakpointId, path: string): void {
  if (breakpoint === 'base') {
    throw commandError(
      COMMAND_CODES.baseIsNotAnOverride,
      'The base value is the prop itself — use setProp',
    )
  }

  if (path.includes('.') || path.includes('[')) {
    throw commandError(
      COMMAND_CODES.responsivePathNotShallow,
      `A breakpoint override is keyed by a top-level prop, not by "${path}"`,
    )
  }
}

/**
 * The ids that are not node ids — `fx_` for an effect instance, `layout_` for a shared-layout key.
 * They come off the same injected counter, so a document built twice from the same options is
 * byte-identical — ADR-061.
 */
export const prefixedId = (generateId: () => NodeId, prefix: string): string =>
  `${prefix}_${generateId().replace(/^node_/, '')}`

/** An index past the ends lands at the ends — a drop below the last child means "last". */
export const clampIndex = (index: number, length: number): number =>
  Math.max(0, Math.min(Math.trunc(index), length))

/**
 * Assigns only when the order actually differs. Immer records a `replace` for any array it is handed,
 * even an identical one, and a no-op drag must not become an undo entry.
 */
export function writeChildren(parent: Draft<Node>, next: readonly NodeId[]): void {
  const unchanged =
    parent.children.length === next.length && parent.children.every((id, at) => id === next[at])

  if (!unchanged) {
    parent.children = [...next]
  }
}

/** Removes a node from whichever parent currently lists it. The node itself is left alone. */
export function detachFromParent(draft: Draft<MotionDocument>, id: NodeId): void {
  const parentId = draft.nodes[id]?.parentId

  if (parentId === undefined || parentId === null) {
    return
  }

  const parent = draft.nodes[parentId]

  if (parent !== undefined) {
    parent.children = parent.children.filter((child) => child !== id)
  }
}
