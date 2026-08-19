import type { BlockDefinition } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { schemaHasPath } from '../test/schema-paths'

import { definitions } from './definitions'
import { HONEYPOT_NAME } from './honeypot'

/**
 * The category's own codegen gate, the shape prompt 40 established for the interactive category: a `'use client'`
 * declaration nobody checks is a comment, and the printer's answer for an undeclared block is to fail rather than
 * to guess (ADR-199).
 */
const ENTRIES = Object.entries(definitions) as readonly [string, BlockDefinition][]

/**
 * ADR-220's measurement, written down as the expectation rather than left in prose. Every block in the category
 * is `always`, and the criterion is one fact rather than five judgements: each of the five calls `useId`, and a
 * hook cannot run in a Server Component.
 */
const EXPECTED: Readonly<Record<string, 'always' | 'never' | 'whenAnyProp'>> = {
  'input-field': 'always',
  'select-field': 'always',
  'checkbox-field': 'always',
  'contact-form': 'always',
  'waitlist-form': 'always',
}

/** The two blocks that own a submit, and therefore the two that must warn about it. */
const WITH_SUBMIT = ['contact-form', 'waitlist-form']

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

      // A subpath import is installed by its package, so that is the name the manifest has to carry.
      const installed = spec.from.startsWith('@')
        ? spec.from.split('/').slice(0, 2).join('/')
        : (spec.from.split('/')[0] ?? spec.from)

      expect(Object.keys(definition.codegen.dependencies ?? {}), id).toContain(installed)
    }
  })

  it('adds no dependency the emitted project cannot install', () => {
    for (const [pkg, range] of Object.entries(definition.codegen.dependencies ?? {})) {
      expect(pkg.startsWith('@motion-studio/'), `${id}: ${pkg}`).toBe(false)
      expect(range, `${id}: ${pkg}`).toMatch(/^[\^~]?\d+\.\d+\.\d+$/)
    }
  })

  it('tells the reader of the generated file that the field is theirs to bind', () => {
    // ADR-185's rule, held for the category: an export that looked finished while doing nothing is the defect.
    expect(definition.codegen.notes?.length ?? 0, id).toBeGreaterThan(0)
  })

  it('takes no slot: a field is a control and the words about it, not a container', () => {
    expect(definition.slots, id).toEqual([])
  })
})

describe('the category as a whole', () => {
  it('needs the directive everywhere, because every block in it calls useId', () => {
    for (const [id, definition] of ENTRIES) {
      expect(definition.codegen.client?.kind, id).toBe('always')
    }
  })

  it('carries no runtime module: nothing here needs a module the export has to write', () => {
    expect(ENTRIES.filter(([, one]) => one.codegen.runtimeModule !== undefined)).toEqual([])
  })

  it('warns about the no-op handler and the honeypot on both blocks that own a submit', () => {
    for (const id of WITH_SUBMIT) {
      const notes = ENTRIES.find(([name]) => name === id)?.[1].codegen.notes ?? []

      expect(
        notes.some((note) => /onSubmit/.test(note)),
        id,
      ).toBe(true)
      expect(
        notes.some((note) => note.includes(HONEYPOT_NAME)),
        id,
      ).toBe(true)
    }
  })

  it('installs React Hook Form and its resolver only where a submit exists', () => {
    for (const [id, definition] of ENTRIES) {
      const dependencies = Object.keys(definition.codegen.dependencies ?? {})

      if (WITH_SUBMIT.includes(id)) {
        expect(dependencies, id).toContain('react-hook-form')
        expect(dependencies, id).toContain('@hookform/resolvers')
        expect(dependencies, id).toContain('zod')
      } else {
        expect(dependencies, id).not.toContain('react-hook-form')
      }
    }
  })
})
