import { describe, expect, it } from 'vitest'

import { migrateDocument } from '../migrations/index'

import { fixtureDocuments } from './__fixtures__/documents'
import { documentSchema, nodeSchema } from './document.schema'

const fixtures = fixtureDocuments()

describe('documentSchema', () => {
  it.each(fixtures.map((document, index) => [index, document] as const))(
    'accepts fixture %i',
    (_index, document) => {
      expect(documentSchema.safeParse(JSON.parse(JSON.stringify(document))).success).toBe(true)
    },
  )

  it('fills the defaults a sparse node leaves out', () => {
    const parsed = nodeSchema.parse({
      id: 'node_1',
      blockId: 'container',
      name: 'Page',
      parentId: null,
      slot: 'root',
      children: [],
    })

    expect(parsed).toMatchObject({
      props: {},
      responsive: {},
      motion: {},
      effects: [],
      locked: false,
      hidden: false,
    })
  })

  it.each([
    ['an id with the wrong prefix', { id: 'block_1' }],
    ['an empty name', { name: '' }],
    ['a name over the cap', { name: 'x'.repeat(81) }],
    ['a block id that is not kebab-case', { blockId: '../etc/passwd' }],
    ['more than eight effects', { effects: Array.from({ length: 9 }, () => ({})) }],
  ])('rejects %s', (_label, overrides) => {
    const parsed = nodeSchema.safeParse({
      id: 'node_1',
      blockId: 'container',
      name: 'Page',
      parentId: null,
      slot: 'root',
      children: [],
      ...overrides,
    })

    expect(parsed.success).toBe(false)
  })
})

/** A small deterministic generator, so a failure reproduces from the seed printed in the name. */
function random(seed: number): () => number {
  let state = seed

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296

    return state / 4294967296
  }
}

const MUTATIONS = [
  'delete',
  'replace-string',
  'replace-number',
  'replace-null',
  'replace-object',
  'replace-array',
  'deep-nest',
] as const

/** Walks to a random leaf and changes it, so mutations land everywhere rather than at the top. */
function mutate(value: unknown, next: () => number): unknown {
  const clone = JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  const kind = MUTATIONS[Math.floor(next() * MUTATIONS.length)] ?? 'delete'

  let cursor: Record<string, unknown> = clone
  let depth = 0

  while (depth < 4) {
    const keys = Object.keys(cursor)
    const key = keys[Math.floor(next() * keys.length)]

    if (key === undefined) {
      break
    }

    const child = cursor[key]

    if (typeof child === 'object' && child !== null && next() > 0.35) {
      cursor = child as Record<string, unknown>
      depth += 1
      continue
    }

    switch (kind) {
      case 'delete':
        delete cursor[key]
        break
      case 'replace-string':
        cursor[key] = 'x'.repeat(Math.floor(next() * 200))
        break
      case 'replace-number':
        cursor[key] = next() > 0.5 ? -1 : Number.MAX_SAFE_INTEGER
        break
      case 'replace-null':
        cursor[key] = null
        break
      case 'replace-object':
        cursor[key] = { __proto__: null, unexpected: true }
        break
      case 'replace-array':
        cursor[key] = [1, 'two', null]
        break
      case 'deep-nest':
        cursor[key] = { a: { b: { c: { d: {} } } } }
        break
    }

    break
  }

  return clone
}

describe('fuzzing', () => {
  it('parses or reports on 1000 mutated documents, and never throws', () => {
    const next = random(20260808)
    let parsed = 0
    let reported = 0

    for (let index = 0; index < 1000; index += 1) {
      const base = fixtures[index % fixtures.length]
      const candidate = mutate(base, next)

      const result = documentSchema.safeParse(candidate)

      if (result.success) {
        parsed += 1
      } else {
        reported += 1
        expect(result.error.issues.length).toBeGreaterThan(0)
      }

      // The version gate sees the same input first, so it is fuzzed with the schema rather than after it.
      expect(() => migrateDocument(candidate)).not.toThrow()
    }

    expect(parsed + reported).toBe(1000)
    // A run where nothing was rejected would mean the mutations are not reaching anything.
    expect(reported).toBeGreaterThan(0)
  })
})
