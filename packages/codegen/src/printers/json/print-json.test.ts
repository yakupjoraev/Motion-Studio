import { documentSchema, serializeDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { fullLanding } from '../../test/documents'

import { documentFileName, printJsonTarget } from './print-json'

/**
 * Prompt 44: "Delegate to `serializeDocument` from `schema`. Do not reimplement — a second serialiser
 * would drift from the byte-stability guarantee. Assert the delegation with a test." The three
 * assertions below are that sentence, in order.
 */
describe('printJsonTarget', () => {
  it('delegates to serializeDocument rather than serialising anything itself', () => {
    const document = fullLanding()
    const result = printJsonTarget({ document })

    expect(result.files[0]?.contents).toBe(`${serializeDocument(document)}\n`)
  })

  it('is byte-stable across two runs', () => {
    const first = printJsonTarget({ document: fullLanding() })
    const second = printJsonTarget({ document: fullLanding() })

    expect(first.files[0]?.contents).toBe(second.files[0]?.contents)
  })

  it('round-trips: what it writes parses back to the document it was given', () => {
    const document = fullLanding()
    const written = printJsonTarget({ document }).files[0]?.contents ?? ''

    expect(documentSchema.parse(JSON.parse(written))).toEqual(document)
  })

  it('installs nothing and warns about nothing, because it generates no code', () => {
    const result = printJsonTarget({ document: fullLanding() })

    expect(result.dependencies).toEqual({})
    expect(result.warnings).toEqual([])
  })

  it('names the file after the document rather than after the target', () => {
    const document = fullLanding()

    expect(documentFileName(document)).toBe('fixture.motion.json')
    expect(
      documentFileName({ ...document, meta: { ...document.meta, name: 'Landing page — v2!' } }),
    ).toBe('landing-page-v2.motion.json')
  })

  it('falls back to a name rather than emitting a file called .motion.json', () => {
    const document = fullLanding()

    expect(documentFileName({ ...document, meta: { ...document.meta, name: '—' } })).toBe(
      'document.motion.json',
    )
  })
})
