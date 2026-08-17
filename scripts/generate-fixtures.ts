import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { blockRegistry } from '@motion-studio/blocks/registry'
import {
  type EffectInstance,
  type MotionDocument,
  type Node,
  type NodeId,
  blockId,
  effectBlockId,
  effectId,
  nodeId,
  serializeDocument,
  validateDocument,
} from '@motion-studio/schema'
import { studioDark } from '@motion-studio/theme'

/**
 * The three stress documents `prompts/34` measures against, written by the same rules the editor
 * follows: block defaults for props, the block's `defaultMotion` materialised into the node
 * (ADR-154), and ids that are a counter — a fixture nobody can reproduce is a measurement nobody can
 * repeat.
 *
 * Run with `pnpm generate:fixtures`. The output is committed; this script is how it is regenerated
 * when a block's defaults change.
 */
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'e2e', 'fixtures', 'documents')

const FIXED_TIME = '2026-01-01T00:00:00.000Z'

interface Builder {
  readonly nodes: Node[]
  next: number
}

const push = (
  builder: Builder,
  block: string,
  parentId: NodeId | null,
  slot: string,
  overrides: Partial<Node> = {},
): NodeId => {
  const definition = blockRegistry.require(blockId(block))

  builder.next += 1

  const id = nodeId(`node_f${String(builder.next).padStart(3, '0')}`)

  builder.nodes.push({
    id,
    blockId: definition.id,
    name: definition.name,
    parentId,
    slot,
    children: [],
    props: definition.propsSchema.parse(definition.defaults) as Record<string, unknown>,
    responsive: {},
    motion: structuredClone(definition.defaultMotion),
    effects: [],
    locked: false,
    hidden: false,
    ...overrides,
  })

  if (parentId !== null) {
    const parent = builder.nodes.find((node) => node.id === parentId)

    if (parent === undefined) {
      throw new Error(`No parent ${parentId} for ${block}`)
    }

    Object.assign(parent, { children: [...parent.children, id] })
  }

  return id
}

/** A surface effect on a node, with the catalogue's own defaults for its parameters. */
const effect = (id: string, catalogue: string): EffectInstance => {
  const definition = blockRegistry.require(effectBlockId(effectId(catalogue)))

  return {
    id: `fx_${id}`,
    effectId: effectId(catalogue),
    params: definition.propsSchema.parse(definition.defaults) as Record<string, unknown>,
    layer: 'behind',
    blendMode: 'normal',
    opacity: 1,
  }
}

const document = (name: string, id: string, nodes: readonly Node[]): MotionDocument => {
  const root = nodes[0]

  if (root === undefined) {
    throw new Error(`${name} has no root`)
  }

  return {
    version: 1,
    meta: {
      id: `doc_${id}`,
      name,
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      generator: 'motion-studio@0.0.0',
      canvas: { width: 1440, background: 'surface-0' },
    },
    theme: studioDark,
    rootId: root.id,
    nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
    assets: {},
  }
}

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
  const builder: Builder = { nodes: [], next: 0 }
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
  const builder: Builder = { nodes: [], next: 0 }
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
  const builder: Builder = { nodes: [], next: 0 }
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
  const builder: Builder = { nodes: [], next: 0 }
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
