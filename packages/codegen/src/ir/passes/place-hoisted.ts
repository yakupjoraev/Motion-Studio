import type { ExportOptions } from '../../options.types'
import type { HoistedConst, IRModule } from '../ir.types'

/** Where a shared variant object lives once eight sections reference it. */
export const MOTION_MODULE_PATH = 'lib/motion.ts'

export const motionSpecifier = (options: ExportOptions): string =>
  options.target === 'next' ? '@/lib/motion' : './lib/motion'

export interface HoistPlacementInput {
  /** One entry per component draft: the hoisted names that draft references. */
  readonly perComponent: readonly (readonly string[])[]
  /** What the motion collector hoisted, by name. */
  readonly hoisted: ReadonlyMap<string, HoistedConst>
}

export interface HoistPlacement {
  /** The names that go in the shared module rather than in each file that uses them. */
  readonly shared: ReadonlySet<string>
  hoistOf(name: string): HoistedConst
  /** The shared module, or `undefined` when nothing is shared and there is no module to write. */
  readonly module: IRModule | undefined
}

/**
 * Which hoisted constants are shared and which are repeated — EXPORT_ENGINE.md § Motion collection.
 * A name referenced by one component belongs in that component's file, where a reader finds it beside
 * its use; a name referenced by several belongs in one module they all import.
 *
 * ADR-259: a fragment may hoist a statement rather than a declaration — a call that registers
 * something rather than naming a value. There is nothing to export and nothing to import, so it stays
 * in every file that needs it, which is where a person would put it.
 */
export function placeHoisted({ perComponent, hoisted }: HoistPlacementInput): HoistPlacement {
  const usage = new Map<string, number>()

  for (const names of perComponent) {
    for (const name of new Set(names)) {
      usage.set(name, (usage.get(name) ?? 0) + 1)
    }
  }

  const hoistOf = (name: string): HoistedConst =>
    hoisted.get(name) ?? { name, code: `const ${name} = {}` }

  const declares = (name: string): boolean => hoistOf(name).code.startsWith('const ')
  const shared = new Set(
    [...usage].filter(([name, count]) => count > 1 && declares(name)).map(([name]) => name),
  )

  if (shared.size === 0) {
    return { shared, hoistOf, module: undefined }
  }

  const consts = [...shared].sort().map(hoistOf)

  return {
    shared,
    hoistOf,
    module: {
      path: MOTION_MODULE_PATH,
      named: consts.map((entry) => entry.name),
      source: consts.map((entry) => `export ${entry.code}`).join('\n\n'),
    },
  }
}
