import { blockRegistry } from '@motion-studio/blocks/registry'
import { presetRegistry } from '@motion-studio/motion'
import type {
  BlockDefinition,
  MotionChannel,
  MotionSpec,
  MotionTrigger,
  Node,
  NodeId,
} from '@motion-studio/schema'

import { type Builder, builder, document, effect, push } from './builder'

/**
 * `coverage-catalogue`: every entry of the shipped catalogue, once — the document the golden coverage
 * audit is asserted against (ADR-258) and the one `verify-export-compile` type-checks, so a block whose
 * markup does not compile fails a pull request rather than a user's build.
 *
 * It is not a page anybody would ship, and that is the point: `export-landing` is the realistic one.
 */
const TRIGGERS: Readonly<Record<MotionChannel, MotionTrigger>> = {
  entrance: { kind: 'inView', amount: 0.3, once: true, margin: '0px' },
  scroll: { kind: 'scrollProgress', start: 'top bottom', end: 'bottom top' },
  hover: { kind: 'hover' },
  press: { kind: 'press' },
  cursor: { kind: 'pointerMove', within: 'element' },
  continuous: { kind: 'always' },
  exit: { kind: 'mount' },
}

const isEffect = (block: BlockDefinition): boolean => block.category === 'effects'

/** A slot takes one child: the block it names, or a paragraph when it takes anything. */
const childFor = (accepts: BlockDefinition['slots'][number]['accepts']): string =>
  accepts === '*' ? 'text' : (accepts[0] ?? 'text')

export function coverageCatalogue(): Node[] {
  const fixture: Builder = builder()
  const root = push(fixture, 'container', null, 'root')
  const blocks = blockRegistry.list().filter((block) => !isEffect(block))
  const placed = new Map<string, NodeId>()

  for (const block of blocks) {
    const id = push(fixture, String(block.id), root, 'children')

    placed.set(String(block.id), id)

    for (const slot of block.slots) {
      push(fixture, childFor(slot.accepts), id, slot.name)
    }
  }

  applyEffects(fixture, blocks, placed)
  applyPresets(fixture, blocks, placed, root)

  return fixture.nodes
}

/** Every effect in the catalogue, one per block, so each one's markup is printed once. */
function applyEffects(
  fixture: Builder,
  blocks: readonly BlockDefinition[],
  placed: ReadonlyMap<string, NodeId>,
): void {
  const effects = blockRegistry.list().filter(isEffect)

  effects.forEach((definition, index) => {
    const host = blocks[index % blocks.length]
    const id = host === undefined ? undefined : placed.get(String(host.id))
    const node = fixture.nodes.find((entry) => entry.id === id)
    const name = String(definition.id).replace('effect:', '')

    if (node !== undefined) {
      Object.assign(node, { effects: [...node.effects, effect(`cover${index}`, name)] })
    }
  })
}

/**
 * Every preset a block will take. `apply-preset.ts` refuses a channel the block does not declare, so a
 * preset on a channel no block offers cannot be placed here either — `catalogue-coverage.test.ts` names
 * that set and fails when it changes.
 */
function applyPresets(
  fixture: Builder,
  blocks: readonly BlockDefinition[],
  placed: ReadonlyMap<string, NodeId>,
  root: NodeId,
): void {
  const counters = new Map<MotionChannel, number>()

  for (const preset of presetRegistry.list()) {
    const channel = preset.channel
    const hosts = blocks.filter((block) => block.capabilities.supportsMotion.includes(channel))

    if (hosts.length === 0) {
      continue
    }

    const seen = counters.get(channel) ?? 0
    const host = hosts[seen % hosts.length]

    counters.set(channel, seen + 1)

    if (host === undefined) {
      continue
    }

    const first = fixture.nodes.find((entry) => entry.id === placed.get(String(host.id)))
    // One preset per node per channel: the second `hover` preset on a block needs a second node of
    // it, or it would overwrite the first and the catalogue would be one preset short.
    const free = first !== undefined && first.motion[channel] === undefined
    const id = free ? undefined : push(fixture, String(host.id), root, 'children')
    const node = free ? first : fixture.nodes.find((entry) => entry.id === id)

    if (node === undefined) {
      continue
    }

    const spec: MotionSpec = {
      presetId: preset.id,
      channel,
      trigger: TRIGGERS[channel],
      params: preset.defaults,
    }

    Object.assign(node, { motion: { ...node.motion, [channel]: spec } })
  }
}

export const coverageDocument = () =>
  document('Coverage — catalogue', 'coveragecatalogue', coverageCatalogue())
