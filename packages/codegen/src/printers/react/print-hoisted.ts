import type { HoistedConst, IRModule } from '../../ir/ir.types'

/**
 * Module constants — EXPORT_ENGINE.md § React, "Hoisted variants and transitions: no inline object
 * literals; readable and stable".
 *
 * Pass 4 wrote the statements and decided which file each one lands in. A constant referenced by one
 * component sits above that component; one referenced by several is already in `ir.modules` as
 * `lib/motion`, which is why this file prints text and makes no placement decision of its own.
 */
export const printHoisted = (hoisted: readonly HoistedConst[]): string =>
  hoisted.map((entry) => entry.code).join('\n\n')

/** A `runtimeModule` or the shared motion module, written beside the components — ADR-201. */
export const printModule = (module: IRModule): string => `${module.source.trimEnd()}\n`
