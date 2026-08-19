import { presetRegistry } from '@motion-studio/motion'
import { CONTROL_KINDS, blockId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { DEFINITIONS, blockRegistry } from '../registry'
import { registryParity, renderRegistry } from '../render-registry'

import { schemaHasPath } from './schema-paths'

/**
 * COMPONENT_LIBRARY.md § Testing: the tests that run over **every** definition. They are worth more
 * than the per-block ones — they are what makes a half-finished block impossible to merge, and every
 * later block prompt inherits them without writing a line.
 */
const ids = DEFINITIONS.map((definition) => definition.id)

describe.each(DEFINITIONS.map((definition) => [definition.id, definition] as const))(
  'block %s',
  (id, definition) => {
    it('parses its own defaults, and parsing them changes nothing', () => {
      const parsed = definition.propsSchema.parse(definition.defaults)

      expect(parsed).toEqual(definition.defaults)
    })

    it('parses its preview props', () => {
      expect(() => definition.propsSchema.parse(definition.previewProps)).not.toThrow()
    })

    it('names every control path in its schema', () => {
      for (const group of definition.controls) {
        for (const control of group.controls) {
          expect(
            schemaHasPath(definition.propsSchema, control.path),
            `${id}: ${group.id}.${control.path}`,
          ).toBe(true)
        }
      }
    })

    it('uses control kinds the inspector implements', () => {
      for (const group of definition.controls) {
        for (const control of group.controls) {
          expect(CONTROL_KINDS).toContain(control.kind)
        }
      }
    })

    it('accepts only blocks that exist', () => {
      for (const slot of definition.slots) {
        if (slot.accepts === '*' || typeof slot.accepts === 'function') {
          continue
        }

        for (const accepted of slot.accepts) {
          expect(ids).toContain(accepted)
        }
      }
    })

    it('declares a slot shape a document can satisfy', () => {
      for (const slot of definition.slots) {
        expect(slot.minChildren).toBeGreaterThanOrEqual(0)

        if (slot.maxChildren !== null) {
          expect(slot.maxChildren).toBeGreaterThanOrEqual(slot.minChildren)
        }
      }
    })

    it('animates only on channels it says it supports', () => {
      for (const channel of Object.keys(definition.defaultMotion)) {
        expect(definition.capabilities.supportsMotion).toContain(channel)
      }
    })

    // COMPONENT_LIBRARY.md § Testing. A spec naming a preset the catalogue does not have resolves to
    // `DISABLED_MOTION` (ADR-138) rather than throwing, so without this the block is simply silent.
    it('defaults to presets the catalogue has, on their own channel', () => {
      for (const [channel, spec] of Object.entries(definition.defaultMotion)) {
        const preset = presetRegistry.get(spec.presetId)

        expect(preset, `${id}: ${channel} → ${spec.presetId}`).toBeDefined()
        expect(preset?.channel, `${id}: ${spec.presetId}`).toBe(channel)
        expect(() => preset?.paramsSchema.parse(spec.params), `${id}: ${channel}`).not.toThrow()
      }
    })

    // ADR-108: the canvas draws handles from this flag, and a gesture with nowhere to commit is a
    // handle that lies. A block claiming it is resizable has to hold a size.
    it('holds a size if it claims to be resizable', () => {
      if (!definition.capabilities.resizable) {
        return
      }

      expect(schemaHasPath(definition.propsSchema, 'width'), id).toBe(true)
      expect(schemaHasPath(definition.propsSchema, 'height'), id).toBe(true)
    })

    it('says something about its accessibility', () => {
      expect(definition.a11y.notes.length).toBeGreaterThan(0)

      for (const note of definition.a11y.notes) {
        expect(note.trim().length).toBeGreaterThan(0)
      }
    })

    it('carries the metadata the palette needs', () => {
      expect(definition.name.length).toBeGreaterThan(0)
      expect(definition.description.length).toBeGreaterThan(0)
      expect(definition.icon.length).toBeGreaterThan(0)
      expect(definition.tags.length).toBeGreaterThan(0)
      expect(definition.codegen.tag.length).toBeGreaterThan(0)
    })

    /*
     * The thumbnail assertion is deliberately *not* here. It was reserved in prompt 22 for this one,
     * and prompt 26 discovered it cannot live in this package: thumbnails are written to
     * `apps/web/public/thumbnails`, and ARCHITECTURE.md § Dependency graph forbids a package reaching
     * into an app. It lives in `scripts/check-registry.ts`, which sees both sides and runs in CI —
     * the same coverage, in the only place entitled to it. ADR-125.
     */
  },
)

describe('the registry as a whole', () => {
  it('registers every definition under its own id', () => {
    for (const definition of DEFINITIONS) {
      expect(blockRegistry.require(definition.id)).toBe(definition)
    }
  })

  it('holds no duplicate ids', () => {
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a component for every definition and a definition for every component', () => {
    expect(registryParity(ids, renderRegistry)).toEqual({ missing: [], extra: [] })
  })

  it('groups by category, in the catalogue order the palette reads', () => {
    expect(blockRegistry.byCategory('layout').map((one) => one.id)).toEqual(
      ['section', 'container', 'stack', 'grid', 'columns', 'spacer', 'divider'].map(blockId),
    )
    expect(blockRegistry.byCategory('hero').map((one) => one.id)).toEqual(
      [
        'hero-centered',
        'hero-split',
        'hero-aurora',
        'hero-video',
        'hero-terminal',
        'hero-app-preview',
      ].map(blockId),
    )
    expect(blockRegistry.byCategory('content').map((one) => one.id)).toEqual(
      [
        'heading',
        'text',
        'rich-text',
        'image',
        'video',
        'code-block',
        'quote',
        'stat',
        'badge',
      ].map(blockId),
    )
  })

  it('groups the marketing category in catalogue order too', () => {
    expect(blockRegistry.byCategory('marketing').map((one) => one.id)).toEqual(
      [
        'feature-grid',
        'feature-split',
        'bento-grid',
        'pricing-table',
        'testimonial-card',
        'testimonial-marquee',
        'logo-cloud',
        'cta-banner',
        'cta-split',
        'faq-accordion',
        'comparison-table',
        'newsletter-form',
      ].map(blockId),
    )
  })

  it('groups the navigation category in catalogue order too', () => {
    expect(blockRegistry.byCategory('navigation').map((one) => one.id)).toEqual(
      ['navbar', 'navbar-floating', 'sidebar-nav', 'footer', 'breadcrumbs', 'dock'].map(blockId),
    )
  })

  /*
   * Prompt 39's universal rules, held for the whole category rather than block by block. The a11y notes
   * are the block's own promise about its keyboard and its names, and a navigation block that made none
   * would pass every other gate in this file.
   */
  it('gives every navigation block a landmark role and something to say about its keyboard', () => {
    for (const definition of blockRegistry.byCategory('navigation')) {
      expect(definition.a11y.role, definition.id).toBeDefined()
      expect(definition.a11y.notes.length, definition.id).toBeGreaterThanOrEqual(4)
      expect(
        definition.a11y.notes.some((note) =>
          /keyboard|arrow|Esc|Enter|Space|focus|tab/i.test(note),
        ),
        definition.id,
      ).toBe(true)
    }
  })

  it('groups the interactive category in catalogue order too', () => {
    expect(blockRegistry.byCategory('interactive').map((one) => one.id)).toEqual(
      [
        'button',
        'button-group',
        'tabs',
        'accordion',
        'carousel',
        'modal-trigger',
        'tooltip-target',
        'command-menu-preview',
        'theme-toggle',
      ].map(blockId),
    )
  })

  it('groups the data category in catalogue order too', () => {
    expect(blockRegistry.byCategory('data').map((one) => one.id)).toEqual(
      ['table', 'stat-grid', 'progress-ring', 'timeline', 'chart-preview'].map(blockId),
    )
  })

  it('groups the forms category in catalogue order too', () => {
    expect(blockRegistry.byCategory('forms').map((one) => one.id)).toEqual(
      ['input-field', 'select-field', 'checkbox-field', 'contact-form', 'waitlist-form'].map(
        blockId,
      ),
    )
  })

  /*
   * ADR-199. The declaration arrived with the interactive category and prompt 41 added the two that complete the
   * catalogue; the fifty-three blocks of the six categories before them are still unaudited, so this asserts what
   * is true today rather than a rule nobody has met. The printer's answer for a block that does not declare one is
   * to fail rather than to guess.
   */
  it('declares a client boundary for the three newest categories and for no others yet', () => {
    const declared = DEFINITIONS.filter((one) => one.codegen.client !== undefined).map(
      (one) => one.id,
    )

    expect(declared).toEqual([
      ...blockRegistry.byCategory('interactive').map((one) => one.id),
      ...blockRegistry.byCategory('data').map((one) => one.id),
      ...blockRegistry.byCategory('forms').map((one) => one.id),
    ])
  })

  it('opts four blocks into container queries and no others (ADR-184)', () => {
    const opted = DEFINITIONS.filter((one) => one.capabilities.containerQuery === true).map(
      (one) => one.id,
    )

    // RESPONSIVE_ENGINE.md § Container queries names exactly these four, and `stat-grid` is the last of them.
    expect(opted).toEqual(
      ['feature-grid', 'bento-grid', 'testimonial-card', 'stat-grid'].map(blockId),
    )
  })

  /*
   * Prompt 41's own gate: the catalogue is complete, and this is the measured size of it.
   *
   * **Not 62.** COMPONENT_LIBRARY.md § Catalogue heads its list with "62 blocks in v1", and that figure is the
   * sum of the six categories before Data and Forms plus the thirteen effects — it was written before the last
   * two categories were, and the list underneath it has always named them. The arithmetic the catalogue's own
   * rows produce is 59 placeable blocks and 13 effect layers. ADR-221 has the count per category and the other
   * documents that still carry the old number.
   */
  it('holds every block the catalogue names, counted', () => {
    const placeable = DEFINITIONS.filter((one) => one.category !== 'effects')

    expect(blockRegistry.list()).toHaveLength(72)
    expect(placeable).toHaveLength(59)
    expect(blockRegistry.byCategory('effects')).toHaveLength(13)
  })

  it('groups the effects category in catalogue order too', () => {
    expect(blockRegistry.byCategory('effects').map((one) => one.id)).toEqual(
      [
        'aurora-background',
        'mesh-gradient',
        'noise-overlay',
        'grain-overlay',
        'dot-grid',
        'grid-lines',
        'spotlight',
        'beams',
        'glow',
        'border-beam',
        'shine',
        'particles',
        'scanlines',
      ].map(blockId),
    )
  })

  it('attaches every effect to a node rather than replacing one', () => {
    for (const definition of blockRegistry.byCategory('effects')) {
      // No slots and no motion channels: an effect is a layer, not a container, and it is its own
      // animation rather than something a preset drives.
      expect(definition.slots, definition.id).toEqual([])
      expect(definition.capabilities.supportsMotion, definition.id).toEqual([])
      expect(definition.capabilities.resizable, definition.id).toBe(false)
    }
  })

  it('registers the block an empty document starts with', () => {
    expect(blockRegistry.get(blockId('container'))).toBeDefined()
  })
})
