import { DEFINITIONS } from '@motion-studio/blocks'
import { EXPORT_TARGETS } from '@motion-studio/codegen/options'
import { PRESETS } from '@motion-studio/motion'
import { describe, expect, it } from 'vitest'

import { LANDING_STATS } from './landing-stats'

/**
 * The gate the drift got past. `4 export targets` was printed by the hero and the OG image while the
 * export dialog rendered five, and nothing failed — the number was a literal in a component nobody
 * counts. Here it is compared with the registry it claims to describe.
 */
describe('the landing statistics', () => {
  it('counts the blocks the registry holds', () => {
    expect(LANDING_STATS.blocks).toBe(DEFINITIONS.length)
  })

  it('counts the presets the catalogue holds', () => {
    expect(LANDING_STATS.presets).toBe(PRESETS.length)
  })

  it('counts the targets the exporter offers', () => {
    expect(LANDING_STATS.exportTargets).toBe(EXPORT_TARGETS.length)
  })
})
