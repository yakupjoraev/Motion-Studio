import type { MotionDocument, NodeId } from '@motion-studio/schema'

import { type Builder, builder, document, effect, push } from './builder'

/**
 * `export-landing`: sixty nodes of the real catalogue, in the shape of a page somebody would ship.
 *
 * It is the document the export decision is measured on — `prompts/45` sets the threshold at sixty
 * nodes — and the document the export end-to-end specs run against. The stress fixtures cannot do
 * either job: they cycle four blocks to reach a node count, so they exercise one printer path many
 * times and none of the ones an export actually meets. This one carries a client boundary, a runtime
 * module, structured data, an image with no alt text, a responsive override and a surface effect,
 * because every one of those is a branch the export takes.
 */
const BANDS: readonly (readonly string[])[] = [
  ['heading', 'text', 'feature-grid'],
  ['heading', 'text', 'bento-grid'],
  ['heading', 'image', 'quote'],
  ['heading', 'text', 'code-block'],
  ['stat', 'stat', 'divider'],
  ['heading', 'comparison-table', 'text'],
  ['heading', 'text', 'badge'],
  ['heading', 'image', 'text'],
  ['quote', 'text', 'stat'],
  ['heading', 'code-block', 'text'],
]

/** Sixty, exactly: the threshold in the prompt is a node count, so the fixture has to be that count. */
const TOTAL = 60

const band = (
  fixture: Builder,
  root: NodeId,
  blocks: readonly string[],
  overrides: Parameters<typeof push>[4] = {},
): void => {
  const section = push(fixture, 'section', root, 'children', overrides)
  const inner = push(fixture, 'container', section, 'children')

  for (const block of blocks) {
    push(fixture, block, inner, 'children')
  }
}

export function exportLanding(): MotionDocument {
  const fixture = builder()
  const root = push(fixture, 'container', null, 'root')

  push(fixture, 'navbar', root, 'children')
  push(fixture, 'hero-split', root, 'children')
  push(fixture, 'logo-cloud', root, 'children')

  for (const [index, blocks] of BANDS.entries()) {
    // One band carries an effect and one carries a breakpoint override, so the export meets both.
    band(
      fixture,
      root,
      blocks,
      index === 2
        ? { effects: [effect('landing', 'aurora-background')] }
        : index === 5
          ? { responsive: { lg: { padding: 'spacious' } } }
          : {},
    )
  }

  push(fixture, 'pricing-table', root, 'children')
  push(fixture, 'testimonial-marquee', root, 'children')
  push(fixture, 'faq-accordion', root, 'children')
  push(fixture, 'cta-split', root, 'children')
  push(fixture, 'cta-banner', root, 'children')
  push(fixture, 'footer', root, 'children')

  if (fixture.nodes.length !== TOTAL) {
    throw new Error(`export-landing has ${fixture.nodes.length} nodes, not ${TOTAL}`)
  }

  return document('Export — landing', 'exportlanding', fixture.nodes)
}
