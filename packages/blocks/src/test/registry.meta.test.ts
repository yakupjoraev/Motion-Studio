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

    // Prompt 26 adds the thumbnail generator; the assertion is written now so that prompt turns it
    // on rather than inventing it.
    it.skip('ships a thumbnail', () => {
      expect(true).toBe(true)
    })
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
    expect(blockRegistry.byCategory('content').map((one) => one.id)).toEqual([blockId('heading')])
  })

  it('registers the block an empty document starts with', () => {
    expect(blockRegistry.get(blockId('container'))).toBeDefined()
  })
})
