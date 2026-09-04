import type { MotionDocument, Node, NodeId } from '@motion-studio/schema'
import { walk } from '@motion-studio/schema'
import { MotionStudioError } from '@motion-studio/utils'

import { type ExportOptions, resolveOptions } from '../options.types'
import type { IRWarning } from '../warnings'

import { type Accumulator, accumulator, buildElement } from './build-element'
import type { BuildIRInput, CodegenIR, IRComponent, IRModule, IRRule, IRTheme } from './ir.types'
import { collectImports } from './passes/collect-imports'
import { createMotionCollector } from './passes/collect-motion'
import { propsFor } from './passes/component-props'
import { detectComponents } from './passes/detect-components'
import { createAssetCollector } from './passes/handle-assets'
import { fileNameFor, nameUnits } from './passes/name-components'
import { MOTION_MODULE_PATH, motionSpecifier, placeHoisted } from './passes/place-hoisted'
import { pruneDependencies, pruneImports, referencedNames } from './passes/prune-imports'

export { MOTION_MODULE_PATH } from './passes/place-hoisted'

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
  const boundaries = detectComponents({ document, registry, markup: input.markup, options, root })
  const nameOf = nameUnits(boundaries.units, document, registry)
  const motion = createMotionCollector({ presets, theme, options })
  const assets = createAssetCollector(document, options)
  const context = {
    document,
    registry,
    options,
    theme,
    boundaries,
    nameOf,
    motion,
    assets,
    markup: input.markup,
  }

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

  const {
    shared,
    hoistOf,
    module: motionModule,
  } = placeHoisted({
    perComponent: drafts.map((draft) => draft.into.hoisted),
    hoisted: motion.hoisted,
  })

  const components: IRComponent[] = drafts.map((draft) => {
    const own = [...new Set(draft.into.hoisted)].filter((name) => !shared.has(name))
    const fromModule = [...new Set(draft.into.hoisted)].filter((name) => shared.has(name))
    const hooks = [...new Set(draft.into.hooks)]
    const hoisted = own.sort().map(hoistOf)
    // ADR-256: what the file names, not what the descriptor declared.
    const referenced = referencedNames({ element: draft.element, hooks, hoisted })
    const imports = collectImports([
      ...pruneImports(draft.into.imports, referenced),
      ...(fromModule.length > 0
        ? [{ from: motionSpecifier(options), named: fromModule.sort() }]
        : []),
    ])
    const reasons = [...new Set(draft.into.clientReasons)]
    const name = nameOf.get(draft.unit.source) ?? 'Section'

    return {
      name,
      fileName: fileNameFor(name, options.language),
      props: propsFor(draft.unit, document),
      imports,
      hoisted,
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

  if (motionModule !== undefined) {
    modules.set(MOTION_MODULE_PATH, motionModule)
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
    dependencies: pruneDependencies(
      dependencies,
      components.flatMap((component) => component.imports.map((spec) => spec.from)),
    ),
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
