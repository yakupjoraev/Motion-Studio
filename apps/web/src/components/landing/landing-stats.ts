/**
 * The three numbers the landing and the OG image print — BRAND.md § Where the numbers come from.
 *
 * They are literals rather than `DEFINITIONS.length`: the hero is a Server Component on the route
 * with the smallest budget in the repository, and importing the block registry to count it would put
 * all 72 block modules in the landing's graph to print one integer. `landing-stats.test.ts` imports
 * the registries instead and fails when a literal here drifts from the thing it counts, which is
 * where the export-target count was found to have been wrong since the page was written (ADR-370).
 */
export const LANDING_STATS = {
  blocks: 72,
  presets: 51,
  exportTargets: 5,
} as const
