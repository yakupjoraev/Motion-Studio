import {
  type BlockCategory,
  type BlockRegistry,
  type MotionDocument,
  type Node,
  type NodeId,
  ancestors,
  resolveResponsiveProps,
  walk,
} from '@motion-studio/schema'

import type { ExportOptions } from '../../options.types'
import { clientReason } from '../client-boundary'

import { extractRepeats } from './extract-repeats'

/**
 * Pass 1 — EXPORT_ENGINE.md § Component boundary detection. Four rules, in this order:
 *
 * 1. the root is the entry component;
 * 2. a section-category direct child of the root is its own component and its own file;
 * 3. a subtree repeated twice or more with the same shape becomes one component with props;
 * 4. everything else inlines into its parent.
 *
 * Plus one that follows from them — ADR-230: a node whose client boundary is active and that would
 * otherwise inline straight into the entry component gets its own component, so the page composing it
 * stays a Server Component.
 *
 * `singleFile: true` collapses all of it into rule 1.
 */
export type UnitKind = 'entry' | 'section' | 'client' | 'extracted'

export interface ComponentUnit {
  readonly kind: UnitKind
  /** The node the component's body is built from. */
  readonly source: NodeId
  /** Every node printed as `<Name … />`, `source` first, in document order. */
  readonly instances: readonly NodeId[]
  /** Props whose value differs between instances, so the component takes them. */
  readonly propNames: readonly string[]
}

export interface Boundaries {
  readonly units: readonly ComponentUnit[]
  /** Source node → its unit, which is how the element pass knows where a subtree stops. */
  readonly unitOf: ReadonlyMap<NodeId, ComponentUnit>
  /** Instance node → the unit it prints as, `source` included. */
  readonly referenceOf: ReadonlyMap<NodeId, ComponentUnit>
}

/**
 * The three categories EXPORT_ENGINE.md names: what makes a Next export read as a project rather than
 * one 900-line page. `layout`, `content`, `interactive`, `data` and `forms` inline — a container is not
 * a section, and a page of them split into files would be worse than the page.
 */
export const SECTION_CATEGORIES: readonly BlockCategory[] = ['hero', 'marketing', 'navigation']

export interface DetectInput {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly options: ExportOptions
  readonly root: NodeId
}

/** Every node reachable from `root` that the export prints. A hidden layer is not on the page. */
function printable(document: MotionDocument, root: NodeId): readonly Node[] {
  const hidden = new Set<NodeId>()

  return [...walk(document, root)].filter((node) => {
    const skip = node.hidden || (node.parentId !== null && hidden.has(node.parentId))

    if (skip) {
      hidden.add(node.id)
    }

    return !skip
  })
}

export function detectComponents(input: DetectInput): Boundaries {
  const { document, registry, options, root } = input
  const nodes = printable(document, root)
  const units: ComponentUnit[] = [{ kind: 'entry', source: root, instances: [root], propNames: [] }]

  if (!options.singleFile) {
    units.push(...sections({ document, registry, nodes, root }))
    units.push(...clientLeaves({ document, registry, nodes, root, taken: units }))
    units.push(...extractRepeats({ document, registry, options, nodes, taken: units }))
  }

  const unitOf = new Map(units.map((unit) => [unit.source, unit]))
  const referenceOf = new Map<NodeId, ComponentUnit>()

  for (const unit of units) {
    for (const instance of unit.instances) {
      referenceOf.set(instance, unit)
    }
  }

  return { units, unitOf, referenceOf }
}

interface RuleInput {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly nodes: readonly Node[]
  readonly root: NodeId
}

/**
 * Rule 2, which is about a *page*: "what makes a Next.js export look like a real project rather than one
 * 900-line page". A selection export is not a page, so this reads the document's own root and matches
 * nothing when the export starts elsewhere — three selected cards then extract into one component
 * instead of becoming three files (ADR-231).
 */
function sections(input: RuleInput): readonly ComponentUnit[] {
  const { document, registry, nodes, root } = input

  if (root !== document.rootId) {
    return []
  }

  const byId = new Map(nodes.map((node) => [node.id, node]))

  return (document.nodes[root]?.children ?? []).flatMap((child) => {
    const node = byId.get(child)
    const category = node === undefined ? undefined : registry.get(node.blockId)?.category

    return category !== undefined && SECTION_CATEGORIES.includes(category)
      ? [{ kind: 'section' as const, source: child, instances: [child], propNames: [] }]
      : []
  })
}

/**
 * ADR-230. EXPORT_ENGINE.md § React wants a static section to stay a Server Component, and the entry
 * component holds every node that inlines. One interactive block loose on the page would therefore make
 * the whole page client — which is the failure prompt 43 names — so it becomes its own component.
 *
 * Only when nothing between it and the root is already a boundary: inside a section, the section is the
 * client component and splitting again would be a file per button.
 */
function clientLeaves(input: RuleInput & { readonly taken: readonly ComponentUnit[] }) {
  const { document, registry, nodes, root, taken } = input
  const boundaries = new Set(taken.map((unit) => unit.source))
  const units: ComponentUnit[] = []

  for (const node of nodes) {
    if (boundaries.has(node.id) || node.parentId === null) {
      continue
    }

    // The entry itself does not count: it is what this rule exists to keep off the client.
    const enclosed = ancestors(document, node.id).some(
      (parent) => parent.id !== root && boundaries.has(parent.id),
    )
    const definition = registry.get(node.blockId)

    if (enclosed || definition === undefined) {
      continue
    }

    const props = resolveResponsiveProps<Record<string, unknown>>(node, 'base')

    if (clientReason(definition, props) !== undefined) {
      units.push({ kind: 'client', source: node.id, instances: [node.id], propNames: [] })
      boundaries.add(node.id)
    }
  }

  return units
}
