import type { IconName } from '@motion-studio/icons'

/**
 * Word-prefix matching over the kebab-case name: `align` finds `align-left`, `left` finds it too, and
 * `eft` finds nothing. Substring matching anywhere would make `on` return a third of the set, which is
 * worse than no filter — and the registry is 89 entries, so there is no index to build.
 */
export function searchIcons(names: readonly IconName[], query: string): readonly IconName[] {
  const needle = query.trim().toLowerCase()

  if (needle === '') {
    return names
  }

  return names.filter((name) =>
    name.split('-').some((word) => word.startsWith(needle) || name.startsWith(needle)),
  )
}
