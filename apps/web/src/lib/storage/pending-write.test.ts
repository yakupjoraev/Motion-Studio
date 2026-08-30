import { type MotionDocument, createEmptyDocument } from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadDocument, saveDocument } from './document-store'
import { closeDatabase } from './idb'
import { PENDING_KEY, clearPending, flushPending, readPending, writePending } from './pending-write'

const documentOf = (name: string): MotionDocument => {
  const ids = counterIds(name)

  return createEmptyDocument({
    name,
    ids: (prefix) => `${prefix}_${ids()}`,
    now: () => new Date(0),
  })
}

beforeEach(() => {
  window.localStorage.clear()
  closeDatabase()
  globalThis.indexedDB = new IDBFactory()
})

describe('the unload lane', () => {
  it('writes and reads a document synchronously', () => {
    const document = documentOf('unsaved')

    expect(writePending(document, 500)).toBe(true)
    expect(readPending()).toEqual({ document, savedAt: 500 })
  })

  it('reports a refusal rather than throwing inside a beforeunload handler', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })

    expect(writePending(documentOf('big'), 1)).toBe(false)

    vi.restoreAllMocks()
  })

  it('ignores a corrupt lane', () => {
    window.localStorage.setItem(PENDING_KEY, '{not json')

    expect(readPending()).toBeNull()
  })

  it('migrates into IndexedDB on the next load', async () => {
    const document = documentOf('recovered')

    writePending(document, 900)

    await expect(flushPending()).resolves.toEqual({ document, savedAt: 900 })
    await expect(loadDocument(document.meta.id)).resolves.toEqual({ document, savedAt: 900 })
    expect(readPending()).toBeNull()
  })

  it('loses to a newer record already in IndexedDB', async () => {
    const document = documentOf('raced')
    const newer = { ...document, meta: { ...document.meta, name: 'Newer' } }

    await saveDocument(newer, 1000)
    writePending(document, 900)

    await expect(flushPending()).resolves.toBeNull()
    await expect(loadDocument(document.meta.id)).resolves.toEqual({
      document: newer,
      savedAt: 1000,
    })
  })

  it('does nothing when the lane is empty', async () => {
    clearPending()

    await expect(flushPending()).resolves.toBeNull()
  })
})
