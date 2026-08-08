import { NODE_ID_RE, validateDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { INITIAL_VIEWPORT } from './slices/viewport-slice'
import { useEditorStore } from './use-store'

/**
 * The singleton is the composition root, so what is worth asserting is that it composes: a valid
 * empty document, the initial view, and a registry that is empty rather than absent. Its ids and its
 * clock are real — ADR-056 — so nothing here asserts on either.
 */
describe('the app-level store', () => {
  it('boots on a valid empty document', () => {
    const { document, version, dirty } = useEditorStore.getState()

    expect(validateDocument(document)).toEqual({ ok: true, value: undefined })
    expect(NODE_ID_RE.test(document.rootId)).toBe(true)
    expect(version).toBe(0)
    expect(dirty).toBe(false)
  })

  it('boots on the documented initial viewport', () => {
    expect(useEditorStore.getState().viewport).toEqual(INITIAL_VIEWPORT)
  })
})
