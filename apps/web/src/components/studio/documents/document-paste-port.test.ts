import { doc, serializeDocument, tree } from '@motion-studio/schema'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  PASTED_FILE_NAME,
  connectDocumentPaste,
  looksLikeDocument,
  tryPasteDocument,
} from './document-paste-port'

const onClipboard = (text: string): void => {
  vi.stubGlobal('navigator', { clipboard: { readText: () => Promise.resolve(text) } })
}

afterEach(() => {
  connectDocumentPaste(undefined)
  vi.unstubAllGlobals()
})

describe('looksLikeDocument', () => {
  it('recognises the envelope', () => {
    expect(looksLikeDocument(serializeDocument(doc(tree({ root: ['a'] }))))).toBe(true)
  })

  it('ignores prose, and JSON that is not a document', () => {
    expect(looksLikeDocument('Some notes about the hero copy')).toBe(false)
    expect(looksLikeDocument('{"version": 1}')).toBe(false)
    expect(looksLikeDocument('[{"nodes": {}, "version": 1}]')).toBe(false)
  })

  it('tolerates leading whitespace, which a copied file has', () => {
    expect(looksLikeDocument('\n  {"version":1,"nodes":{}}')).toBe(true)
  })
})

describe('tryPasteDocument', () => {
  it('declines when no surface is listening', async () => {
    onClipboard(serializeDocument(doc(tree({ root: ['a'] }))))

    await expect(tryPasteDocument()).resolves.toBe(false)
  })

  it('hands a document to the handler and reports that it took the paste', async () => {
    const text = serializeDocument(doc(tree({ root: ['a'] })))
    const handler = vi.fn()

    connectDocumentPaste(handler)
    onClipboard(text)

    await expect(tryPasteDocument()).resolves.toBe(true)
    expect(handler).toHaveBeenCalledWith(text, PASTED_FILE_NAME)
  })

  it('declines anything that is not a document, so the block paste still runs', async () => {
    const handler = vi.fn()

    connectDocumentPaste(handler)
    onClipboard('just some text')

    await expect(tryPasteDocument()).resolves.toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('treats a refused clipboard as “not a document”, not as an error', async () => {
    const handler = vi.fn()

    connectDocumentPaste(handler)
    vi.stubGlobal('navigator', {
      clipboard: { readText: () => Promise.reject(new Error('denied')) },
    })

    await expect(tryPasteDocument()).resolves.toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })
})
