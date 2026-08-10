import { commands } from '@motion-studio/editor'
import {
  BLOCK_CATEGORIES,
  type BlockDefinition,
  type BlockRegistry,
  type MotionDocument,
  type Node,
  type NodeId,
  type SlotDefinition,
  isDescendant,
} from '@motion-studio/schema'

export type DropVerdict = { readonly ok: true } | { readonly ok: false; readonly reason: string }

const OK: DropVerdict = { ok: true }

const no = (reason: string): DropVerdict => ({ ok: false, reason })

export interface ValidateDropArgs {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly parent: Node
  readonly slot: SlotDefinition
  readonly dragged: BlockDefinition
  /** Empty for a palette insert; the moving subtree's roots for a node move. */
  readonly draggedNodeIds: readonly NodeId[]
}

/**
 * DRAG_AND_DROP.md § Validation rules, in the order a user meets them. Each rejection carries the
 * sentence the indicator shows and the announcer reads, because "invalid" tells someone that
 * something is wrong and nothing about what to do instead.
 *
 * The three slot predicates are `editor`'s own rather than copies of them: a drop this function
 * accepts and the command then throws on would be the worst of both (ADR-131).
 */
export function validateDrop(args: ValidateDropArgs): DropVerdict {
  const { document, parent, slot, draggedNodeIds } = args

  if (parent.locked) {
    return no('Layer is locked')
  }

  if (parent.hidden) {
    return no('Layer is hidden')
  }

  for (const id of draggedNodeIds) {
    if (id === parent.id || isDescendant(document, parent.id, id)) {
      return no('Cannot drop into itself')
    }
  }

  if (!commands.slotAccepts(slot, args.dragged)) {
    return no(acceptsReason(args))
  }

  const occupied = commands.slotChildren(document, parent, slot.name)
  // A node already in this slot is leaving it, so it does not count against the maximum.
  const staying = occupied.filter((id) => !draggedNodeIds.includes(id))
  const incoming = Math.max(1, draggedNodeIds.length)

  if (!commands.slotHasRoom(slot, staying.length, incoming)) {
    return no(capacityReason(parent, slot))
  }

  return OK
}

/** "Navbar accepts up to 6 links" — the slot's own label is what the count is counting. */
function capacityReason(parent: Node, slot: SlotDefinition): string {
  const max = slot.maxChildren

  if (max === null) {
    return `${parent.name} is full`
  }

  return `${parent.name} accepts up to ${max} ${max === 1 ? singular(slot) : plural(slot)}`
}

/** "Section only accepts layout blocks" when the list agrees on a category, and names when it does not. */
function acceptsReason({ parent, slot, dragged, registry }: ValidateDropArgs): string {
  const accepts = slot.accepts

  if (accepts === '*' || typeof accepts === 'function') {
    return `${parent.name} does not accept ${dragged.name}`
  }

  if (accepts.length === 0) {
    return `${parent.name} accepts nothing in ${plural(slot)}`
  }

  const categories = new Set(accepts.map((id) => registry.get(id)?.category))
  const [only] = [...categories]

  if (categories.size === 1 && only !== undefined) {
    return `${parent.name} only accepts ${BLOCK_CATEGORIES[only].toLowerCase()} blocks`
  }

  return `${parent.name} only accepts ${accepts.map((id) => registry.get(id)?.name ?? id).join(', ')}`
}

const plural = (slot: SlotDefinition): string => slot.label.toLowerCase()

/** "1 child" reads better than "1 children", and a slot label is written plural. */
const singular = (slot: SlotDefinition): string => plural(slot).replace(/s$/, '')
