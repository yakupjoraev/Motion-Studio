import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { presetRegistry } from '@motion-studio/motion'
import { documentSchema } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

/**
 * The golden coverage audit — ADR-258. `scripts/verify-export-compile.mjs` exports the committed
 * fixture documents from the shipped catalogue and type-checks the result, so what these assertions
 * are really asserting is that every catalogue entry goes through the export on every pull request.
 *
 * It lives here because it needs both registries and the documents: `codegen` may not import
 * `packages/blocks`, and this app already reads the same directory to serve fixtures to the studio.
 */
const DOCUMENTS = join(process.cwd(), '..', '..', 'e2e', 'fixtures', 'documents')

const documents = readdirSync(DOCUMENTS)
  .filter((name) => name.endsWith('.motion.json'))
  .map((name) => documentSchema.parse(JSON.parse(readFileSync(join(DOCUMENTS, name), 'utf8'))))

const nodes = documents.flatMap((document) => Object.values(document.nodes))
const placedBlocks = new Set(nodes.map((node) => String(node.blockId)))
const placedEffects = new Set(
  nodes.flatMap((node) => node.effects.map((instance) => String(instance.effectId))),
)
const placedPresets = new Set(
  nodes.flatMap((node) =>
    Object.values(node.motion)
      .filter((spec) => spec !== undefined)
      .map((spec) => spec.presetId),
  ),
)

const catalogue = blockRegistry.list()
const effects = catalogue.filter((block) => block.category === 'effects')
const blocks = catalogue.filter((block) => block.category !== 'effects')
const offered = new Set(blocks.flatMap((block) => block.capabilities.supportsMotion))

/**
 * The presets no block will take: `apply-preset.ts` offers a preset only to a block that declares its
 * channel, and no block in the catalogue declares `cursor`, `press` or `exit`. They cannot be placed
 * in a document, so they cannot be exported, and this list is the report of that. A block that starts
 * offering one of those channels fails this test until the fixture covers it.
 */
const UNREACHABLE_CHANNELS = ['cursor', 'exit'] as const

describe('every block reaches the export', () => {
  it('places all 58 blocks in a committed document', () => {
    const missing = blocks.map((block) => String(block.id)).filter((id) => !placedBlocks.has(id))

    expect(missing).toEqual([])
  })

  it('places all 14 effects on a node in a committed document', () => {
    const missing = effects
      .map((block) => String(block.id).replace('effect:', ''))
      .filter((id) => !placedEffects.has(id))

    expect(missing).toEqual([])
  })

  it('counts the catalogue it audited, so a shrinking registry is not a passing test', () => {
    expect(catalogue).toHaveLength(72)
    expect(presetRegistry.list()).toHaveLength(51)
  })
})

describe('every preset a block will take reaches the export', () => {
  it('places each of them in a committed document', () => {
    const missing = presetRegistry
      .list()
      .filter((preset) => offered.has(preset.channel))
      .map((preset) => preset.id)
      .filter((id) => !placedPresets.has(id))

    expect(missing).toEqual([])
  })

  /** The gap, named. It is the catalogue's, not the fixture's — no block offers these channels. */
  it('leaves exactly the channels no block offers uncovered', () => {
    const uncovered = presetRegistry
      .list()
      .filter((preset) => !placedPresets.has(preset.id))
      .map((preset) => preset.channel)

    expect([...new Set(uncovered)].sort()).toEqual([...UNREACHABLE_CHANNELS])
  })
})
