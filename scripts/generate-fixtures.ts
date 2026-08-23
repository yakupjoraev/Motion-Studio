import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type MotionDocument, serializeDocument, validateDocument } from '@motion-studio/schema'

import { type Builder, builder as builderOf, document, effect, push } from './fixtures/builder'
import { exportLanding } from './fixtures/export-landing'

/**
 * The committed fixtures: the three stress documents `prompts/34` measures against, the responsive
 * one, and the sixty-node landing the export is measured and exercised on. How a node is written is
 * `./fixtures/builder`; this file is the list and the writer.
 *
 * Run with `pnpm generate:fixtures`. The output is committed; this script is how it is regenerated
 * when a block's defaults change.
 */
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'e2e', 'fixtures', 'documents')

/** The content blocks a band cycles through, so 200 nodes exercise more than one renderer. */
const BAND_CONTENT: readonly string[] = [
  'heading',
  'text',
  'stat',
  'badge',
  'quote',
  'image',
  'code-block',
  'divider',
]

/**
 * `stress-200-nodes`: the canvas budget's own number — PERFORMANCE.md § Budgets asks for 60 fps with
 * 200 nodes. Bands of a section holding a container of content, filled until the count is exact.
 */
function stress200(): MotionDocument {
  const builder: Builder = builderOf()
  const root = push(builder, 'container', null, 'root')
  let content = 0

  while (builder.nodes.length < 200) {
    const section = push(builder, 'section', root, 'children')
    const inner = push(builder, 'container', section, 'children')

    for (let index = 0; index < 8 && builder.nodes.length < 200; index += 1) {
      const block = BAND_CONTENT[content % BAND_CONTENT.length] as string

      content += 1
      push(builder, block, inner, 'children')
    }
  }

  return document('Stress — 200 nodes', 'stress200', builder.nodes)
}

/** The six surface effects that never stop moving, one per band — ANIMATION_SYSTEM.md § Continuous. */
const CONTINUOUS_EFFECTS: readonly string[] = [
  'aurora-background',
  'mesh-gradient',
  'beams',
  'particles',
  'shine',
  'border-beam',
]

/**
 * `stress-motion-heavy`: twenty sections that animate on arrival, six of them also carrying a
 * continuous effect. This is the document the frame budget is measured on.
 */
function stressMotionHeavy(): MotionDocument {
  const builder: Builder = builderOf()
  const root = push(builder, 'container', null, 'root')

  for (let band = 0; band < 20; band += 1) {
    const continuous = CONTINUOUS_EFFECTS[band]
    const section = push(
      builder,
      'section',
      root,
      'children',
      continuous === undefined ? {} : { effects: [effect(`heavy${band}`, continuous)] },
    )
    const inner = push(builder, 'container', section, 'children')

    push(builder, 'heading', inner, 'children')
    push(builder, 'text', inner, 'children')
    push(builder, 'stat', inner, 'children')
  }

  return document('Stress — motion heavy', 'stressmotion', builder.nodes)
}

/**
 * `stress-glass`: eight stacked blur surfaces.
 *
 * ADR-155: no block in the catalogue writes `backdrop-filter` today — the glass recipes in
 * DESIGN_SYSTEM.md § Blur and glass are used by the studio chrome, and the blocks that will use them
 * arrive with prompts 38–41. Until they do, this fixture stacks the eight blur-based surface effects
 * the catalogue does have, which is what the layer-count measurement is actually about.
 */
const GLASS_EFFECTS: readonly string[] = [
  'aurora-background',
  'mesh-gradient',
  'glow',
  'grain-overlay',
  'noise-overlay',
  'spotlight',
  'dot-grid',
  'grid-lines',
]

function stressGlass(): MotionDocument {
  const builder: Builder = builderOf()
  const root = push(builder, 'container', null, 'root')

  for (const [index, surface] of GLASS_EFFECTS.entries()) {
    const section = push(builder, 'section', root, 'children', {
      effects: [effect(`glass${index}`, surface)],
    })
    const inner = push(builder, 'container', section, 'children')

    push(builder, 'heading', inner, 'children')
    push(builder, 'text', inner, 'children')
  }

  return document('Stress — glass', 'stressglass', builder.nodes)
}

/**
 * `responsive-grid`: one grid with two cards in it, and nothing else. The responsive spec edits its
 * `columns` at one breakpoint and reads it back at another, so the document has to be small enough
 * that a failure is about the cascade rather than about which of two hundred nodes was selected.
 */
function responsiveGrid(): MotionDocument {
  const builder: Builder = builderOf()
  const root = push(builder, 'container', null, 'root')
  const grid = push(builder, 'grid', root, 'children')

  push(builder, 'heading', grid, 'children')
  push(builder, 'text', grid, 'children')

  return document('Responsive — grid', 'responsivegrid', builder.nodes)
}

const FIXTURES: Readonly<Record<string, () => MotionDocument>> = {
  'stress-200-nodes': stress200,
  'stress-motion-heavy': stressMotionHeavy,
  'stress-glass': stressGlass,
  'responsive-grid': responsiveGrid,
  'export-landing': exportLanding,
}

mkdirSync(OUT_DIR, { recursive: true })

for (const [name, build] of Object.entries(FIXTURES)) {
  const built = build()
  const validated = validateDocument(built)

  if (!validated.ok) {
    throw new Error(`${name} is not a valid document: ${JSON.stringify(validated.error)}`)
  }

  writeFileSync(join(OUT_DIR, `${name}.motion.json`), serializeDocument(built), 'utf8')
  console.log(`${name}: ${Object.keys(built.nodes).length} nodes`)
}
