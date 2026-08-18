import type { BlockDefinition } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { schemaHasPath } from '../test/schema-paths'

import { MAX_ACCORDION_ITEMS } from './accordion/accordion.schema'
import { MAX_SLIDES } from './carousel/carousel.schema'
import { definitions } from './definitions'
import { MAX_TABS } from './tabs/tabs.schema'

/**
 * The category's own codegen gate. Prompt 40 is where the `'use client'` declaration arrives (ADR-199), and a
 * declaration nobody checks is a comment — so every one of the nine is checked here, and a `whenAnyProp`
 * condition naming a prop the schema does not have fails the build.
 */
const ENTRIES = Object.entries(definitions) as readonly [string, BlockDefinition][]

/** ADR-199's measurement, written down as the expectation rather than left in prose. */
const EXPECTED: Readonly<Record<string, 'always' | 'never' | 'whenAnyProp'>> = {
  button: 'never',
  'button-group': 'always',
  tabs: 'always',
  accordion: 'always',
  carousel: 'whenAnyProp',
  'modal-trigger': 'always',
  'tooltip-target': 'always',
  'command-menu-preview': 'never',
  'theme-toggle': 'always',
}

/** The four blocks that take children, and the cap each one's slot must match. */
const SLOT_CAPS: Readonly<Record<string, number>> = {
  tabs: MAX_TABS,
  accordion: MAX_ACCORDION_ITEMS,
  carousel: MAX_SLIDES,
  // One content region rather than a list of panels.
  'modal-trigger': 1,
}

describe.each(ENTRIES)('%s', (id, definition) => {
  it('declares whether its export needs the client directive', () => {
    const client = definition.codegen.client

    expect(client, id).toBeDefined()
    expect(client?.kind).toBe(EXPECTED[id])
  })

  it('says why, in a sentence a reader can check against the component', () => {
    expect(definition.codegen.client?.reason.trim().length ?? 0).toBeGreaterThan(20)
  })

  it('names only props its own schema has', () => {
    const client = definition.codegen.client

    if (client?.kind !== 'whenAnyProp') {
      return
    }

    expect(client.props.length).toBeGreaterThan(0)
    for (const path of client.props) {
      expect(schemaHasPath(definition.propsSchema, path), `${id}: ${path}`).toBe(true)
    }
  })

  it('declares a dependency for every non-relative import it emits', () => {
    for (const spec of definition.codegen.imports ?? []) {
      if (spec.from.startsWith('.')) {
        // A relative import can only resolve to a module the export writes itself.
        expect(definition.codegen.runtimeModule, id).toBeDefined()
        continue
      }

      expect(Object.keys(definition.codegen.dependencies ?? {}), id).toContain(spec.from)
    }
  })

  /* ADR-206: the slot cap and the item cap are two numbers that have to agree. */
  it('caps its slot at its own item cap, so no child can belong to a panel that does not exist', () => {
    const slot = definition.slots[0]
    const cap = SLOT_CAPS[id]

    if (cap === undefined) {
      expect(slot, id).toBeUndefined()

      return
    }

    expect(slot?.maxChildren, id).toBe(cap)
  })
})

describe('the category as a whole', () => {
  it('leaves exactly two blocks needing no directive at all', () => {
    const never = ENTRIES.filter(([, one]) => one.codegen.client?.kind === 'never').map(
      ([id]) => id,
    )

    expect(never).toEqual(['button', 'command-menu-preview'])
  })

  it('carries exactly one runtime module, and it is the toggle’s', () => {
    const withModule = ENTRIES.filter(([, one]) => one.codegen.runtimeModule !== undefined)

    expect(withModule.map(([id]) => id)).toEqual(['theme-toggle'])
  })

  it('adds no dependency the emitted project cannot install', () => {
    for (const [id, definition] of ENTRIES) {
      for (const [name, range] of Object.entries(definition.codegen.dependencies ?? {})) {
        expect(name.startsWith('@motion-studio/'), `${id}: ${name}`).toBe(false)
        expect(range, `${id}: ${name}`).toMatch(/^[\^~]?\d+\.\d+\.\d+$/)
      }
    }
  })
})
