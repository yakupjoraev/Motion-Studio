import {
  type BlockRegistry,
  CASCADE_ORDER,
  type ImportSpec,
  type MarkupRegistry,
  type MotionDocument,
  type Node,
  type NodeId,
  resolveResponsiveProps,
} from '@motion-studio/schema'
import { MotionStudioError, getPath } from '@motion-studio/utils'

import type { ExportOptions } from '../options.types'
import { type IRWarning, warning } from '../warnings'

import { applyMarkup } from './apply-markup'
import { clientReason } from './client-boundary'
import type { ComponentName, IRChild, IRElement, IRRule, IRTheme, IRValue } from './ir.types'
import type { MotionCollector } from './passes/collect-motion'
import type { Boundaries, ComponentUnit } from './passes/detect-components'
import type { AssetCollector } from './passes/handle-assets'
import { liftProps } from './passes/lift-props'
import { applyResponsive } from './passes/responsive-classes'
import { mergeAndSort } from './tailwind/merge-classes'

/**
 * The element tree, built once per component boundary. Not one of the six passes — it is what calls
 * three of them, node by node, and stops at the next boundary so a section prints as `<HeroSection />`
 * rather than as its own body a second time.
 */
export interface ElementContext {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly options: ExportOptions
  readonly theme: IRTheme
  readonly boundaries: Boundaries
  readonly nameOf: ReadonlyMap<NodeId, ComponentName>
  readonly motion: MotionCollector
  readonly assets: AssetCollector
  /** ADR-249. Empty until a block has a producer, and then it is that block's whole interior. */
  readonly markup: MarkupRegistry
}

/** What one component's body contributes, gathered as the tree is walked rather than re-derived. */
export interface Accumulator {
  readonly imports: ImportSpec[]
  readonly hooks: string[]
  readonly hoisted: string[]
  readonly classes: string[]
  readonly rules: IRRule[]
  readonly warnings: IRWarning[]
  readonly clientReasons: string[]
  readonly undeclared: string[]
}

export const accumulator = (): Accumulator => ({
  imports: [],
  hooks: [],
  hoisted: [],
  classes: [],
  rules: [],
  warnings: [],
  clientReasons: [],
  undeclared: [],
})

const literal = (value: unknown): IRValue | undefined => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { kind: 'literal', value }
  }

  return value === undefined || value === null
    ? undefined
    : { kind: 'expression', code: JSON.stringify(value) }
}

export function buildElement(
  nodeId: NodeId,
  unit: ComponentUnit,
  context: ElementContext,
  into: Accumulator,
): IRElement | undefined {
  const node = context.document.nodes[nodeId]

  if (node === undefined) {
    return undefined
  }

  const definition = context.registry.get(node.blockId)

  if (definition === undefined) {
    into.warnings.push(
      warning(
        'unsupported',
        `No block '${node.blockId}' in the registry; the node is skipped.`,
        node.id,
      ),
    )

    return undefined
  }

  const props = resolveResponsiveProps<Record<string, unknown>>(node, 'base')

  if (definition.codegen.client === undefined) {
    into.undeclared.push(String(definition.id))
  }

  const reason = clientReason(definition, props)

  if (reason !== undefined) {
    into.clientReasons.push(reason)
  }

  const motion = context.motion.collect(node)
  const media = context.assets.collect(node, definition)
  const passthrough = definition.codegen.passthroughProps ?? []
  const attributes: Record<string, IRValue> = {}

  for (const name of passthrough) {
    const isProp = unit.propNames.includes(name)
    const value = isProp
      ? ({ kind: 'reference', name } satisfies IRValue)
      : literal(getPath(props, name))

    if (value !== undefined) {
      attributes[name] = value
    }
  }

  for (const name of media.suppressed) {
    delete attributes[name]
  }

  Object.assign(attributes, media.attributes, motion.attributes)

  into.imports.push(
    ...(definition.codegen.imports ?? []).filter((spec) => spec.from !== 'next/image'),
  )
  into.imports.push(...media.imports, ...motion.imports)
  into.hooks.push(...motion.hooks)
  into.hoisted.push(...motion.hoisted)
  const producer = context.markup[String(definition.id)]

  if (producer === undefined) {
    // ADR-252: a block without a producer has no interior, which is not a page anybody asked for.
    throw new MotionStudioError(
      `Block '${definition.id}' declares no markup producer, so it cannot be exported.`,
      'MARKUP_PRODUCER_MISSING',
    )
  }

  /** Sorted as one list: a CSS-engine preset's class is on the element too, not appended after it. */
  const classNames = mergeAndSort(motion.classNames)
  const structured = definition.codegen.structuredData
  const emitStructured = structured !== undefined && getPath(props, structured.enabledBy) === true
  const extras = {
    ...(motion.presets.length === 0 ? {} : { motion: motion.presets }),
    ...(definition.codegen.notes === undefined ? {} : { notes: definition.codegen.notes }),
    ...(emitStructured && structured !== undefined ? { structuredData: structured.type } : {}),
  }

  /*
   * The producer owns the interior and the root's own classes; everything the export decides for the
   * element — the motion wrapper's tag prefix, the asset collector's attributes, the preset list, the
   * notes and the structured data — is still applied here, because none of it is a block's to know.
   */
  const filled = slotsOf(node, unit, context, into)
  const counts = Object.fromEntries([...filled].map(([name, list]) => [name, list.length]))
  const produce = (at: Record<string, unknown>) =>
    applyMarkup(producer({ props: at, id: String(node.id), slots: counts }), filled)

  const applied = produce(props)

  /*
   * The producer is a pure function of its props, so a breakpoint's overrides are answered by running
   * it again with them — ADR-252. `applyResponsive` compares the trees and carries the difference as
   * prefixed classes, or as a rule when it is an inline declaration.
   */
  const layers = CASCADE_ORDER.filter(
    (breakpoint) => breakpoint !== 'base' && node.responsive[breakpoint] !== undefined,
  ).map((breakpoint) => ({
    breakpoint,
    root: produce(resolveResponsiveProps<Record<string, unknown>>(node, breakpoint)).root,
  }))

  /* A shared component's body says `{plan}` where this node said "Starter" — ADR-252. */
  const body = liftProps(applied.root, props, unit.propNames)
  const responsive = applyResponsive(body, layers, node.id)

  into.rules.push(...responsive.rules)
  into.warnings.push(...responsive.warnings)
  into.classes.push(...applied.classes, ...classNames, ...responsive.root.classNames)

  return {
    ...responsive.root,
    tag: `${motion.tagPrefix ?? ''}${media.tag ?? responsive.root.tag}`,
    classNames: mergeAndSort([...responsive.root.classNames, ...classNames]),
    attributes: { ...responsive.root.attributes, ...attributes },
    ...extras,
  }
}

/** The document's children, grouped by the slot each one was dropped into. */
function slotsOf(
  node: Node,
  unit: ComponentUnit,
  context: ElementContext,
  into: Accumulator,
): ReadonlyMap<string, readonly IRChild[]> {
  const slots = new Map<string, IRChild[]>()

  for (const entry of childEntries(node, unit, context, into)) {
    const list = slots.get(entry.slot) ?? []

    list.push(entry.element)
    slots.set(entry.slot, list)
  }

  return slots
}

/** A child and the slot it sits in, so a producer can place each slot where its markup says. */
interface ChildEntry {
  readonly slot: string
  readonly element: IRChild
}

function childEntries(
  node: Node,
  unit: ComponentUnit,
  context: ElementContext,
  into: Accumulator,
): readonly ChildEntry[] {
  const entries: ChildEntry[] = []

  for (const childId of node.children) {
    const child = context.document.nodes[childId]

    if (child === undefined || child.hidden) {
      continue
    }

    const boundary = context.boundaries.referenceOf.get(childId)
    const element =
      boundary !== undefined && boundary !== unit
        ? referenceElement(childId, boundary, context)
        : buildElement(childId, unit, context, into)

    if (element !== undefined) {
      entries.push({ slot: child.slot, element })
    }
  }

  return entries
}

/**
 * `<PlanCard plan={…} />`: the boundary's name, and the props this instance differs in.
 *
 * No `key`. Three siblings written out in JSX are not a mapped array, and the only value available was
 * the node's id — the first editor artifact EXPORT_ENGINE.md § React's rule table bans (ADR-234).
 */
function referenceElement(
  nodeId: NodeId,
  unit: ComponentUnit,
  context: ElementContext,
): IRElement | undefined {
  const name = context.nameOf.get(unit.source)
  const node = context.document.nodes[nodeId]

  if (name === undefined || node === undefined) {
    return undefined
  }

  const attributes: Record<string, IRValue> = {}

  for (const prop of unit.propNames) {
    const value = literal(node.props[prop])

    if (value !== undefined) {
      attributes[prop] = value
    }
  }

  return {
    kind: 'element',
    tag: name,
    classNames: [],
    attributes,
    children: [],
  }
}
