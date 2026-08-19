import type { BlockDefinition } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { schemaHasPath } from '../test/schema-paths'

import { definitions } from './definitions'
import { MAX_TIMELINE_ITEMS } from './timeline/timeline.schema'

/**
 * The category's own codegen gate, the shape prompt 40 established for the interactive category: a `'use client'`
 * declaration nobody checks is a comment, and the printer's answer for an undeclared block is to fail rather than
 * to guess (ADR-199).
 */
const ENTRIES = Object.entries(definitions) as readonly [string, BlockDefinition][]

/**
 * ADR-220's measurement, written down as the expectation. Only `table` needs the directive, and the criterion is a
 * fact about each component rather than a judgement: it is the only one of the five that calls a hook.
 */
const EXPECTED: Readonly<Record<string, 'always' | 'never' | 'whenAnyProp'>> = {
  table: 'always',
  'stat-grid': 'never',
  'progress-ring': 'never',
  timeline: 'never',
  'chart-preview': 'never',
}

/** The one block that takes children, and the cap its slot must match. */
const SLOT_CAPS: Readonly<Record<string, number>> = { timeline: MAX_TIMELINE_ITEMS }

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

    for (const path of client.props) {
      expect(schemaHasPath(definition.propsSchema, path), `${id}: ${path}`).toBe(true)
    }
  })

  it('declares a dependency for every non-relative import it emits', () => {
    for (const spec of definition.codegen.imports ?? []) {
      if (spec.from.startsWith('.')) {
        expect(definition.codegen.runtimeModule, id).toBeDefined()
        continue
      }

      expect(Object.keys(definition.codegen.dependencies ?? {}), id).toContain(spec.from)
    }
  })

  it('adds no dependency the emitted project cannot install', () => {
    for (const [pkg, range] of Object.entries(definition.codegen.dependencies ?? {})) {
      expect(pkg.startsWith('@motion-studio/'), `${id}: ${pkg}`).toBe(false)
      expect(range, `${id}: ${pkg}`).toMatch(/^[\^~]?\d+\.\d+\.\d+$/)
    }
  })

  it('caps its slot at its own item cap, so no child can belong to a step that does not exist', () => {
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
  it('leaves four of the five needing no directive at all', () => {
    const never = ENTRIES.filter(([, one]) => one.codegen.client?.kind === 'never').map(
      ([id]) => id,
    )

    expect(never).toEqual(['stat-grid', 'progress-ring', 'timeline', 'chart-preview'])
  })

  it('takes exactly one dependency, and it is the table’s', () => {
    const withDependencies = ENTRIES.filter(
      ([, one]) => Object.keys(one.codegen.dependencies ?? {}).length > 0,
    )

    expect(withDependencies.map(([id]) => id)).toEqual(['table'])
    // `chart-preview` draws its own paths: no chart library, which is the whole reason it is `cheap`.
    expect(ENTRIES.find(([id]) => id === 'chart-preview')?.[1].capabilities.costClass).toBe('cheap')
  })

  it('carries no runtime module: nothing here needs a module the export has to write', () => {
    expect(ENTRIES.filter(([, one]) => one.codegen.runtimeModule !== undefined)).toEqual([])
  })
})
