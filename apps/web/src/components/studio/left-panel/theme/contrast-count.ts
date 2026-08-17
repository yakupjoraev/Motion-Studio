import type { ThemeResolution } from '@motion-studio/theme'

/**
 * How many contrast notices a resolution carries: repairs made, repairs declined, and pairs no step of
 * the ramp can fix.
 *
 * Its own module, and deliberately so: the tab strip reads this number on every render, and importing
 * it from `contrast-report.tsx` would pull the report — and with it the buttons, the collapsible and
 * the edit hook — into the studio's initial chunk. The panel itself is a lazy chunk; this is the one
 * thing about it the strip needs eagerly.
 */
export const contrastNoticeCount = (resolution: ThemeResolution): number =>
  resolution.repairs.length + resolution.overrides.length + resolution.warnings.length
