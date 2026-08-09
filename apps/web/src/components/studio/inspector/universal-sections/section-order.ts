import type { BlockDefinition, ControlGroup } from '@motion-studio/schema'

/**
 * ADR-110. A universal section is a canonical id, label and position — filled with the block's own
 * controls that declare that group. It writes no prop the block did not declare, because invariant 7
 * would reject the command the moment a user touched it.
 */
export const CANONICAL_SECTIONS = [
  { id: 'layout', label: 'Layout' },
  { id: 'style', label: 'Style' },
  { id: 'typography', label: 'Typography' },
  { id: 'content', label: 'Content' },
] as const

const humanize = (id: string): string => id.charAt(0).toUpperCase() + id.slice(1)

export interface OrderedGroup {
  readonly id: string
  readonly label: string
  readonly group: ControlGroup
}

/** Canonical sections first, in their order, then whatever else the block declared, in its order. */
export function orderedGroups(definition: BlockDefinition): readonly OrderedGroup[] {
  const byId = new Map(definition.controls.map((group) => [group.id, group]))
  const ordered: OrderedGroup[] = []

  for (const section of CANONICAL_SECTIONS) {
    const group = byId.get(section.id)

    if (group !== undefined) {
      ordered.push({ id: section.id, label: section.label, group })
      byId.delete(section.id)
    }
  }

  for (const [id, group] of byId) {
    ordered.push({ id, label: group.label.length > 0 ? group.label : humanize(id), group })
  }

  return ordered
}

/**
 * ADR-108's gate, read from the same place the canvas reads it: a block that cannot take a size does
 * not get sizing controls, and the answer comes from capabilities rather than from a list of ids.
 */
export const sizingAllowed = (definition: BlockDefinition): boolean =>
  definition.capabilities.resizable
