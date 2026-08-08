import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { setDocumentMeta } from './set-document-meta'

describe('setDocumentMeta', () => {
  it('renames the document', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(setDocumentMeta({ path: 'name', value: 'Landing' }))

    expect(harnessed.document().meta.name).toBe('Landing')
  })

  it('writes the canvas settings', () => {
    const harnessed = harness()
    const state = harnessed.store.getState()

    state.dispatch(setDocumentMeta({ path: 'canvas.width', value: 1280 }))
    state.dispatch(setDocumentMeta({ path: 'canvas.background', value: 'surface-1' }))

    expect(harnessed.document().meta.canvas).toEqual({ width: 1280, background: 'surface-1' })
  })

  it('writes one patch', () => {
    const harnessed = harness()

    expect(capturePatches(harnessed, setDocumentMeta({ path: 'name', value: 'Landing' }))).toEqual([
      { op: 'replace', path: ['meta', 'name'], value: 'Landing' },
    ])
  })

  it('refuses a field that is provenance rather than a setting', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(setDocumentMeta({ path: 'id', value: 'doc_other' })),
      ),
    ).toBe(COMMAND_CODES.metaPathNotEditable)
    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(setDocumentMeta({ path: 'updatedAt', value: '2026-01-02T00:00:00.000Z' })),
      ),
    ).toBe(COMMAND_CODES.metaPathNotEditable)
  })

  it('refuses a value the file format would reject', () => {
    const harnessed = harness()

    expect(
      codeOf(() =>
        harnessed.store.getState().dispatch(setDocumentMeta({ path: 'canvas.width', value: 4 })),
      ),
    ).toBe(COMMAND_CODES.invalidMeta)
    expect(harnessed.document().meta.canvas.width).toBe(1440)
  })

  it('coalesces per field', () => {
    expect(setDocumentMeta({ path: 'name', value: 'x' }).coalesceKey).toBe('meta:name')
  })
})
