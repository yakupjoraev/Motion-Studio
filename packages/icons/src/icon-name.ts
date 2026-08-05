import { ICON_REGISTRY } from './registry'

/**
 * Derived from the registry rather than declared beside it, so the two cannot disagree: adding an entry adds
 * a name, and there is no second list to forget. `registry.test.ts` closes the other half of the loop by
 * asserting every icon module on disk has an entry here.
 */
export type IconName = keyof typeof ICON_REGISTRY

export const ICON_NAMES = Object.keys(ICON_REGISTRY) as readonly IconName[]
