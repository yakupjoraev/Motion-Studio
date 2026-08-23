import type { BlockRegistry, MotionDocument, Node, NodeId } from '@motion-studio/schema'
import { walk } from '@motion-studio/schema'
import { MotionStudioError } from '@motion-studio/utils'

import { type ExportOptions, resolveOptions } from '../options.types'
import type { IRWarning } from '../warnings'

import { type Accumulator, accumulator, buildElement } from './build-element'
import type {
  BuildIRInput,
  CodegenIR,
  ComponentName,
  HoistedConst,
  IRComponent,
  IRModule,
  IRProp,
  IRRule,
  IRTheme,
} from './ir.types'
import { collectImports } from './passes/collect-imports'
import { createMotionCollector } from './passes/collect-motion'
import { type ComponentUnit, detectComponents } from './passes/detect-components'
import { createAssetCollector } from './passes/handle-assets'
import { fileNameFor, toComponentName, uniqueName } from './passes/name-components'

/**
 * `buildIR` — EXPORT_ENGINE.md § buildIR. Six passes, orchestrated here, and nothing decided twice:
 * boundaries, then names, then per-node classes / motion / assets as the element tree is walked, then
 * the document-wide merges — imports, hoisting placement, dependencies, the stylesheet.
 *
 * The one thing that stops an export is a block whose descriptor does not declare its client boundary.
 * Warnings never block; that one is not a warning, because both available guesses ship something
 * broken — ADR-199, ADR-227.
 */
export const CODEGEN_ERROR_CODES = {
  undeclaredClient: 'UNDECLARED_CLIENT_BOUNDARY',
  missingSelection: 'MISSING_SELECTION',
} as const

/**
 * Why the undeclared case is an error rather than a warning — ADR-199, restated where it is thrown so a
 * reader of the message does not have to look it up.
 */
const GUESSES_ARE_BOTH_WRONG =
  "'never' ships a page that throws in the browser; 'always' costs every Server Component in the tree."

/** Where a shared variant object lives once eight sections reference it. */
export const MOTION_MODULE_PATH = 'lib/motion.ts'

const motionSpecifier = (options: ExportOptions): string =>
  options.target === 'next' ? '@/lib/motion' : './lib/motion'

function rootFor(
  document: MotionDocument,
  options: ExportOptions,
  selection: NodeId | undefined,
): NodeId {
  if (options.scope === 'document') {
    return document.rootId
  }

  if (selection === undefined || document.nodes[selection] === undefined) {
    throw new MotionStudioError(
      `scope 'selection' needs a node that is in the document; got ${String(selection)}`,
      CODEGEN_ERROR_CODES.missingSelection,
    )
  }

  return selection
}

export function toIRTheme(config: MotionDocument['theme']): IRTheme {
  return {
    id: config.id,
    name: config.name,
    colorMode: config.colorMode,
    fontPairing: config.typography.pairing,
    radiusScale: config.radiusScale,
    spacingScale: config.spacingScale,
    motionScale: config.motionScale,
    config,
  }
}

/**
 * Names are assigned in document order, which is what makes them stable: the same document produces
 * the same list on every run, so a re-export is a diff a reader can read.
 */
function nameUnits(
  units: readonly ComponentUnit[],
  document: MotionDocument,
  registry: BlockRegistry,
): ReadonlyMap<NodeId, ComponentName> {
  const taken = new Set<string>()
  const names = new Map<NodeId, ComponentName>()

  units.forEach((unit, index) => {
    const node = document.nodes[unit.source]
    const blockName =
      node === undefined ? 'Section' : (registry.get(node.blockId)?.name ?? 'Section')
    const candidate = toComponentName(node?.name ?? '', `${blockName} ${index + 1}`)
    const name = uniqueName(candidate, taken)

    taken.add(name)
    names.set(unit.source, name)
  })

  return names
}

const typeOf = (value: unknown): IRProp['type'] => {
  switch (typeof value) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    default:
      return 'json'
  }
}

function propsFor(unit: ComponentUnit, document: MotionDocument): readonly IRProp[] {
  const first = document.nodes[unit.source]

  if (first === undefined) {
    return []
  }

  return unit.propNames.map((name) => {
    const value = first.props[name]

    return {
      name,
      type: typeOf(value),
      defaultValue:
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? { kind: 'literal' as const, value }
          : { kind: 'expression' as const, code: JSON.stringify(value ?? null) },
    }
  })
}

const ruleKey = (rule: IRRule): string =>
  `${rule.media ?? ''}|${rule.selector}|${rule.declarations.join(';')}`

/** Every node the export prints, so the document-wide merges walk the tree once rather than per pass. */
function printableNodes(document: MotionDocument, root: NodeId): readonly Node[] {
  const hidden = new Set<NodeId>()

  return [...walk(document, root)].filter((node) => {
    const skip = node.hidden || (node.parentId !== null && hidden.has(node.parentId))

    if (skip) {
      hidden.add(node.id)
    }

    return !skip
  })
}

export function buildIR(input: BuildIRInput): CodegenIR {
  const { document, registry, presets } = input
  const options = resolveOptions(input.options)
  const root = rootFor(document, options, input.selection)
  const theme = toIRTheme(document.theme)
  const boundaries = detectComponents({ document, registry, options, root })
  const nameOf = nameUnits(boundaries.units, document, registry)
  const motion = createMotionCollector({ presets, theme, options })
  const assets = createAssetCollector(document, options)
  const markup = input.markup ?? {}
  const context = { document, registry, options, theme, boundaries, nameOf, motion, assets, markup }

  const drafts = boundaries.units.flatMap((unit) => {
    const into: Accumulator = accumulator()
    const element = buildElement(unit.source, unit, context, into)

    return element === undefined ? [] : [{ unit, into, element }]
  })

  const undeclared = [...new Set(drafts.flatMap((draft) => draft.into.undeclared))].sort()

  if (undeclared.length > 0) {
    throw new MotionStudioError(
      `No client boundary declared by ${undeclared.join(', ')}. ${GUESSES_ARE_BOTH_WRONG}`,
      CODEGEN_ERROR_CODES.undeclaredClient,
    )
  }

  const usage = new Map<string, number>()

  for (const draft of drafts) {
    for (const name of new Set(draft.into.hoisted)) {
      usage.set(name, (usage.get(name) ?? 0) + 1)
    }
  }

  const shared = new Set([...usage].filter(([, count]) => count > 1).map(([name]) => name))
  const hoistOf = (name: string): HoistedConst =>
    motion.hoisted.get(name) ?? { name, code: `const ${name} = {}` }

  const components: IRComponent[] = drafts.map((draft) => {
    const own = [...new Set(draft.into.hoisted)].filter((name) => !shared.has(name))
    const fromModule = [...new Set(draft.into.hoisted)].filter((name) => shared.has(name))
    const imports = collectImports([
      ...draft.into.imports,
      ...(fromModule.length > 0
        ? [{ from: motionSpecifier(options), named: fromModule.sort() }]
        : []),
    ])
    const hooks = [...new Set(draft.into.hooks)]
    const reasons = [...new Set(draft.into.clientReasons)]
    const name = nameOf.get(draft.unit.source) ?? 'Section'

    return {
      name,
      fileName: fileNameFor(name, options.language),
      props: propsFor(draft.unit, document),
      imports,
      hoisted: own.sort().map(hoistOf),
      hooks,
      client: clientFor(reasons, hooks),
      root: draft.element,
      usedClasses: [...new Set(draft.into.classes)],
    }
  })

  const nodes = printableNodes(document, root)
  const dependencies: Record<string, string> = { ...motion.dependencies }
  const modules = new Map<string, IRModule>()

  for (const node of nodes) {
    const descriptor = registry.get(node.blockId)?.codegen

    for (const [name, range] of Object.entries(descriptor?.dependencies ?? {})) {
      dependencies[name] = range
    }

    const runtime = descriptor?.runtimeModule

    if (runtime !== undefined && !modules.has(runtime.path)) {
      modules.set(runtime.path, runtime)
    }
  }

  if (shared.size > 0) {
    const consts = [...shared].sort().map(hoistOf)

    modules.set(MOTION_MODULE_PATH, {
      path: MOTION_MODULE_PATH,
      named: consts.map((entry) => entry.name),
      source: consts.map((entry) => `export ${entry.code}`).join('\n\n'),
    })
  }

  const rules = new Map<string, IRRule>()

  for (const rule of [...drafts.flatMap((draft) => draft.into.rules), ...motion.rules]) {
    rules.set(ruleKey(rule), rule)
  }

  const warnings: readonly IRWarning[] = [
    ...drafts.flatMap((draft) => draft.into.warnings),
    ...motion.warnings,
    ...assets.warnings,
  ]

  return {
    components,
    entry: nameOf.get(root) ?? 'Section',
    documentName: document.meta.name,
    theme,
    assets: assets.assets,
    stylesheet: { rules: [...rules.values()], keyframes: motion.keyframes },
    modules: [...modules.values()],
    dependencies,
    warnings,
  }
}

/**
 * Two independent reasons, either sufficient — EXPORT_ENGINE.md § React. The block says it holds state,
 * or the component's own body calls a hook. A component with neither stays a Server Component.
 */
function clientFor(reasons: readonly string[], hooks: readonly string[]): IRComponent['client'] {
  if (reasons.length > 0) {
    return { emit: true, reason: reasons.join(' ') }
  }

  if (hooks.length > 0) {
    return { emit: true, reason: 'The component calls a hook for its motion.' }
  }

  return { emit: false, reason: 'Nothing in this component holds state or calls a hook.' }
}
