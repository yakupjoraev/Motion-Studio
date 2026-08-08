import { describe, expect, it } from 'vitest'

import type { MotionDocument } from './document.types'

import { fixtureDocuments } from './__fixtures__/documents'
import { documentSchema } from './document.schema'
import { serializeDocument, withStableKeyOrder } from './serialize'

const fixtures = fixtureDocuments()

/** `noUncheckedIndexedAccess` is on, and a fixture index is a constant this file controls. */
const fixture = (index: number): MotionDocument => fixtures[index] as MotionDocument

describe('serializeDocument', () => {
  it('has twenty fixtures to prove itself on', () => {
    expect(fixtures).toHaveLength(20)
  })

  it.each(fixtures.map((document, index) => [index, document] as const))(
    'fixture %i round-trips through parse without changing a byte',
    (_index, document) => {
      const once = serializeDocument(document)
      const parsed = documentSchema.parse(JSON.parse(once))

      expect(serializeDocument(parsed)).toBe(once)
    },
  )

  it.each(fixtures.map((document, index) => [index, document] as const))(
    'fixture %i serialises identically twice',
    (_index, document) => {
      expect(serializeDocument(document)).toBe(serializeDocument(document))
    },
  )

  it('writes schema order at the top level', () => {
    const keys = Object.keys(JSON.parse(serializeDocument(fixture(11))))

    expect(keys).toEqual(['$schema', 'version', 'meta', 'theme', 'rootId', 'nodes', 'assets'])
  })

  it('writes schema order inside a node, whatever order it was built in', () => {
    const scrambled = {
      ...fixture(1),
      nodes: Object.fromEntries(
        Object.entries(fixture(1).nodes).map(([id, node]) => [
          id,
          Object.fromEntries(Object.entries(node as object).reverse()),
        ]),
      ),
    }

    const first = Object.values(
      JSON.parse(serializeDocument(scrambled as unknown as MotionDocument)).nodes as Record<
        string,
        object
      >,
    )[0]

    expect(Object.keys(first ?? {}).slice(0, 4)).toEqual(['id', 'blockId', 'name', 'parentId'])
  })

  it('sorts anything the table does not name, so props diff cleanly', () => {
    const document = fixture(6)
    const props = Object.values(
      JSON.parse(serializeDocument(document)).nodes as Record<string, { props: object }>,
    )[0]?.props

    expect(Object.keys(props ?? {})).toEqual(['align', 'columns', 'gap'])
  })

  it('indents with two spaces and ends with a newline', () => {
    const text = serializeDocument(fixture(1))

    expect(text.endsWith('}\n')).toBe(true)
    expect(text.split('\n')[1]?.startsWith('  ')).toBe(true)
  })

  it('changes nothing but the order', () => {
    const document = fixture(7)

    expect(withStableKeyOrder(document)).toEqual(JSON.parse(JSON.stringify(document)))
  })
})
