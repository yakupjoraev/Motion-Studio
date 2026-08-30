import { createEmptyDocument } from '@motion-studio/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  INDEX_KEY,
  entryOf,
  readIndex,
  readLastOpenId,
  reconcileIndex,
  removeEntry,
  renameEntry,
  upsertEntry,
  writeLastOpenId,
} from './document-index'

const entry = (id: string, updatedAt: number) => ({ id, name: id, updatedAt, nodeCount: 1 })

beforeEach(() => {
  window.localStorage.clear()
})

describe('the document index', () => {
  it('starts empty', () => {
    expect(readIndex()).toEqual([])
  })

  it('sorts by recency, newest first', () => {
    upsertEntry(entry('doc_a', 100))
    upsertEntry(entry('doc_b', 300))
    upsertEntry(entry('doc_c', 200))

    expect(readIndex().map((found) => found.id)).toEqual(['doc_b', 'doc_c', 'doc_a'])
  })

  it('replaces an entry rather than appending a second one', () => {
    upsertEntry(entry('doc_a', 100))
    upsertEntry({ ...entry('doc_a', 200), name: 'Renamed' })

    expect(readIndex()).toEqual([{ id: 'doc_a', name: 'Renamed', updatedAt: 200, nodeCount: 1 }])
  })

  it('renames and removes', () => {
    upsertEntry(entry('doc_a', 100))

    expect(renameEntry('doc_a', 'Hero page')[0]?.name).toBe('Hero page')
    expect(removeEntry('doc_a')).toEqual([])
  })

  it('drops entries whose document is gone', () => {
    upsertEntry(entry('doc_a', 100))
    upsertEntry(entry('doc_b', 200))

    expect(reconcileIndex(['doc_b']).map((found) => found.id)).toEqual(['doc_b'])
  })

  it('survives a corrupt value rather than failing to open the studio', () => {
    window.localStorage.setItem(INDEX_KEY, '{not json')

    expect(readIndex()).toEqual([])
  })

  it('ignores entries that are not entries', () => {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify([{ id: 'doc_a' }, entry('doc_b', 1)]))

    expect(readIndex().map((found) => found.id)).toEqual(['doc_b'])
  })

  it('builds an entry from a document', () => {
    const document = createEmptyDocument({ name: 'Landing' })

    expect(entryOf(document, 42)).toEqual({
      id: document.meta.id,
      name: 'Landing',
      updatedAt: 42,
      nodeCount: 1,
    })
  })

  it('keeps working when storage refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })

    expect(() => upsertEntry(entry('doc_a', 1))).not.toThrow()

    vi.restoreAllMocks()
  })

  it('remembers the last open document', () => {
    expect(readLastOpenId()).toBeNull()

    writeLastOpenId('doc_a')

    expect(readLastOpenId()).toBe('doc_a')
  })
})
