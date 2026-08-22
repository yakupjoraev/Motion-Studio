import {
  type BlockRegistry,
  type MotionDocument,
  type Node,
  type NodeId,
  walk,
} from '@motion-studio/schema'
import { deepEqual } from '@motion-studio/utils'

import { hashValue } from '../../hash'
import type { ExportOptions } from '../../options.types'

import type { ComponentUnit } from './detect-components'

/**
 * Rule 3 of pass 1 — EXPORT_ENGINE.md § Component boundary detection: a subtree repeated twice or more
 * with the same shape becomes one component with props. It lives beside `detect-components` rather than
 * inside it because the shape hash is the whole of ADR-228 and the rest of pass 1 does not read it.
 */

/**
 * Props that change the printed body rather than travelling into it as a value — ADR-228. A prop a
 * class rule reads is baked into `className` at build time, so two nodes that disagree on one cannot
 * share a component body.
 */
function structuralProps(registry: BlockRegistry, node: Node): readonly string[] {
  const descriptor = registry.get(node.blockId)?.codegen

  if (descriptor === undefined) {
    return []
  }

  const fromClasses = (descriptor.classes ?? []).flatMap((rule) =>
    rule.kind === 'static' ? [] : [rule.prop],
  )
  const gate = descriptor.structuredData?.enabledBy

  return gate === undefined ? fromClasses : [...fromClasses, gate]
}

const pick = (
  props: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): Record<string, unknown> => Object.fromEntries(keys.map((key) => [key, props[key]]))

export function shapeHashes(
  registry: BlockRegistry,
  nodes: readonly Node[],
): ReadonlyMap<NodeId, string> {
  const hashes = new Map<NodeId, string>()
  const present = new Set(nodes.map((node) => node.id))

  // Deepest first, so a node's children are hashed before it is.
  for (const node of [...nodes].reverse()) {
    hashes.set(
      node.id,
      hashValue({
        block: node.blockId,
        slot: node.slot,
        responsive: node.responsive,
        motion: node.motion,
        effects: node.effects,
        structural: pick(node.props, structuralProps(registry, node)),
        children: node.children
          .filter((child) => present.has(child))
          .map((child) => hashes.get(child) ?? ''),
      }),
    )
  }

  return hashes
}

/** Prop names whose value is not the same across every instance. Sorted, so it is stable. */
function differingProps(nodes: readonly Node[]): readonly string[] {
  const [first, ...rest] = nodes

  if (first === undefined || rest.length === 0) {
    return []
  }

  const keys = [...new Set(nodes.flatMap((node) => Object.keys(node.props)))].sort()

  return keys.filter((key) => rest.some((node) => !deepEqual(node.props[key], first.props[key])))
}

export interface RepeatInput {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly options: ExportOptions
  readonly nodes: readonly Node[]
  readonly taken: readonly ComponentUnit[]
}

const descendantIds = (document: MotionDocument, id: NodeId): readonly NodeId[] =>
  [...walk(document, id)].slice(1).map((node) => node.id)

/**
 * Shallowest first, and every node inside a chosen subtree is claimed, so a repeated card inside a
 * repeated section extracts the section — the outer boundary is the one a reader would draw.
 * Over-extraction is the failure mode this ordering exists to avoid.
 */
export function extractRepeats(input: RepeatInput): readonly ComponentUnit[] {
  const { document, registry, options, nodes, taken } = input
  const hashes = shapeHashes(registry, nodes)
  const claimed = new Set<NodeId>(taken.flatMap((unit) => [...unit.instances]))
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const groups = new Map<string, NodeId[]>()

  for (const node of nodes) {
    if (claimed.has(node.id)) {
      continue
    }

    const key = hashes.get(node.id) ?? node.id
    const group = groups.get(key)

    if (group === undefined) {
      groups.set(key, [node.id])
    } else {
      group.push(node.id)
    }
  }

  const units: ComponentUnit[] = []

  // `nodes` is document order, so a parent is considered before its children.
  for (const node of nodes) {
    if (claimed.has(node.id)) {
      continue
    }

    const group = (groups.get(hashes.get(node.id) ?? node.id) ?? []).filter(
      (id) => !claimed.has(id),
    )

    if (group.length < 2) {
      continue
    }

    const instances = group.flatMap((id) => {
      const found = byId.get(id)

      return found === undefined ? [] : [found]
    })
    const propNames = differingProps(instances)

    // With no props to lift, three cards that differ would print identically — so they do not extract.
    if (propNames.length > 0 && !options.extractProps) {
      continue
    }

    for (const id of group) {
      claimed.add(id)

      for (const child of descendantIds(document, id)) {
        claimed.add(child)
      }
    }

    units.push({ kind: 'extracted', source: group[0] as NodeId, instances: group, propNames })
  }

  return units
}
