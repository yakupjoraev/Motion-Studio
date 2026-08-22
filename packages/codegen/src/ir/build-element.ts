import {
  type BlockDefinition,
  type BlockRegistry,
  type ImportSpec,
  type MotionDocument,
  type Node,
  type NodeId,
  resolveResponsiveProps,
} from '@motion-studio/schema'
import { getPath } from '@motion-studio/utils'

import type { ExportOptions } from '../options.types'
import { type IRWarning, warning } from '../warnings'

import { clientReason } from './client-boundary'
import type { ComponentName, IRChild, IRElement, IRRule, IRTheme, IRValue } from './ir.types'
import type { MotionCollector } from './passes/collect-motion'
import type { Boundaries, ComponentUnit } from './passes/detect-components'
import { generateClasses } from './passes/generate-classes'
import type { AssetCollector } from './passes/handle-assets'
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

  const classes = generateClasses(node, definition, context.theme)
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
  into.rules.push(...classes.rules)
  into.warnings.push(...classes.warnings)

  reportUnreachedProps(node, definition, classes.consumed, passthrough, into.warnings)

  /** Sorted as one list: a CSS-engine preset's class is on the element too, not appended after it. */
  const classNames = mergeAndSort([...classes.classNames, ...motion.classNames])

  into.classes.push(...classNames)

  const tag = `${motion.tagPrefix ?? ''}${media.tag ?? definition.codegen.tag}`
  const structured = definition.codegen.structuredData
  const emitStructured = structured !== undefined && getPath(props, structured.enabledBy) === true

  return {
    kind: 'element',
    tag,
    classNames,
    attributes,
    children: childrenOf(node, unit, context, into),
    ...(Object.keys(classes.cssVars).length > 0 ? { cssVars: classes.cssVars } : {}),
    ...(definition.codegen.notes === undefined ? {} : { notes: definition.codegen.notes }),
    ...(emitStructured && structured !== undefined ? { structuredData: structured.type } : {}),
  }
}

function childrenOf(
  node: Node,
  unit: ComponentUnit,
  context: ElementContext,
  into: Accumulator,
): readonly IRChild[] {
  const children: IRChild[] = []

  for (const childId of node.children) {
    const child = context.document.nodes[childId]

    if (child === undefined || child.hidden) {
      continue
    }

    const boundary = context.boundaries.referenceOf.get(childId)

    if (boundary !== undefined && boundary !== unit) {
      const reference = referenceElement(childId, boundary, context)

      if (reference !== undefined) {
        children.push(reference)
      }

      continue
    }

    const element = buildElement(childId, unit, context, into)

    if (element !== undefined) {
      children.push(element)
    }
  }

  return children
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

/**
 * ADR-229. A prop that reached neither a class rule nor an attribute is named in the export report,
 * because the alternative is a page that looks finished and ships a blank section.
 */
function reportUnreachedProps(
  node: Node,
  definition: BlockDefinition,
  consumed: readonly string[],
  passthrough: readonly string[],
  warnings: IRWarning[],
): void {
  const routed = new Set([
    ...consumed,
    ...passthrough,
    ...(definition.codegen.structuredData === undefined
      ? []
      : [definition.codegen.structuredData.enabledBy]),
  ])
  const missing = Object.keys(node.props)
    .filter((name) => !routed.has(name))
    .sort()

  if (missing.length === 0) {
    return
  }

  warnings.push(
    warning(
      'unsupported',
      `${definition.id} has no export route for ${missing.join(', ')}; its descriptor covers the root element only.`,
      node.id,
    ),
  )
}
