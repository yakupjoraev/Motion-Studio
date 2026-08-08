import { counterIds } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { createEmptyDocument } from './create-empty'
import { documentSchema } from './document.schema'
import { serializeDocument } from './serialize'
import { validateDocument } from './validate'

const frozen = () => new Date('2026-01-01T00:00:00.000Z')

describe('createEmptyDocument', () => {
  it('produces a document that parses and validates', () => {
    const document = createEmptyDocument()

    expect(documentSchema.safeParse(JSON.parse(serializeDocument(document))).success).toBe(true)
    expect(validateDocument(document).ok).toBe(true)
  })

  it('has exactly one node, and it is the root', () => {
    const document = createEmptyDocument()

    expect(Object.keys(document.nodes)).toHaveLength(1)
    expect(document.nodes[document.rootId]?.parentId).toBeNull()
    expect(document.nodes[document.rootId]?.children).toEqual([])
  })

  it('is reproducible when its id generator and clock are injected', () => {
    const options = { ids: counterIds('node'), now: frozen }

    // A fresh counter per call, so the two documents are built from the same sequence.
    expect(serializeDocument(createEmptyDocument({ ...options, ids: counterIds('node') }))).toBe(
      serializeDocument(createEmptyDocument({ ...options, ids: counterIds('node') })),
    )
  })

  it('stamps both timestamps with the same instant', () => {
    const document = createEmptyDocument({ now: frozen })

    expect(document.meta.createdAt).toBe(document.meta.updatedAt)
  })

  it('takes a name and a generator from the caller', () => {
    const document = createEmptyDocument({ name: 'Landing', generator: 'motion-studio@1.2.3' })

    expect(document.meta.name).toBe('Landing')
    expect(document.meta.generator).toBe('motion-studio@1.2.3')
  })

  it('rejects an id generator that produces a malformed id', () => {
    expect(() => createEmptyDocument({ ids: () => 'nope' })).toThrow()
  })
})
