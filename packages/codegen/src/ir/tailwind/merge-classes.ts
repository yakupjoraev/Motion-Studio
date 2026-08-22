import { cn } from '@motion-studio/utils'

import { sortClasses } from './class-order'

/**
 * `tailwind-merge` semantics at build time, so the emitted markup needs no runtime `cn()` —
 * EXPORT_ENGINE.md § Class generation. The same `cn` the studio paints with, which is what keeps a
 * conflict resolved one way on the canvas from being resolved another way in the export.
 *
 * Merge before sort: `twMerge` decides a conflict by which class comes *later*, and that is the class
 * plan's order — base before override, and the override wins. Sorting first would hand the decision to
 * the family table instead.
 */
export function mergeAndSort(classNames: readonly string[]): readonly string[] {
  const merged = cn(...classNames)

  return merged === '' ? [] : sortClasses(merged.split(' '))
}
