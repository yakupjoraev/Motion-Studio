import { blockRegistry } from '@motion-studio/blocks/registry'
import { blockId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import {
  CARD_STAGE_WIDTH,
  PLATE_HEIGHT,
  cardStage,
  measuredBlockHeight,
  stagedBlockIds,
} from './card-stage'

/**
 * The table is a set of measurements, and a measurement nobody re-reads is a number that used to be
 * true. These are the parts of that which do not need a browser; `e2e/blocks/card-stage.spec.ts`
 * measures the blocks themselves.
 */
describe('the stage table and the registry', () => {
  it('names every block in the catalogue and nothing else', () => {
    const registered = blockRegistry.list().map((definition) => definition.id as string)

    expect([...stagedBlockIds()].sort()).toEqual([...registered].sort())
  })

  it('gives every block a stage that fits it', () => {
    for (const definition of blockRegistry.list()) {
      const block = measuredBlockHeight(definition.id) ?? 0
      const stage = cardStage(definition.id)

      expect(stage.width).toBe(CARD_STAGE_WIDTH)
      // A stage shorter than its block is the clipping ADR-386 removed.
      expect(stage.height).toBeGreaterThanOrEqual(block)
    }
  })
})

describe('one stage', () => {
  it('puts the same air above and below the block', () => {
    const stage = cardStage(blockId('navbar'))

    expect(stage.height - stage.air * 2).toBe(measuredBlockHeight('navbar'))
  })

  it('gives an effect the whole plate and no air', () => {
    const stage = cardStage(blockId('particles'))

    expect(stage).toEqual({ width: CARD_STAGE_WIDTH, height: PLATE_HEIGHT, air: 0 })
  })

  it('holds the tallest block in the catalogue without cutting it off', () => {
    const tallest = Math.max(...stagedBlockIds().map((id) => measuredBlockHeight(id) ?? 0))
    const stage = cardStage(blockId('hero-split'))

    expect(measuredBlockHeight('hero-split')).toBe(tallest)
    expect(stage.height).toBeGreaterThan(tallest)
  })

  it('lands on the same height for two blocks of a similar size, so a row reads as a row', () => {
    expect(cardStage(blockId('stack')).height).toBe(cardStage(blockId('columns')).height)
    expect(cardStage(blockId('button')).height).toBe(cardStage(blockId('badge')).height)
  })

  it('falls back to the plate for a block the table does not name', () => {
    // as unknown as: the argument's type forbids an id outside the catalogue, and the fallback for
    // one is exactly what this asserts — a block added without a measurement gets air, not a cut.
    const stage = cardStage('block-nobody-measured' as unknown as ReturnType<typeof blockId>)

    expect(stage.height).toBe(PLATE_HEIGHT)
  })
})
