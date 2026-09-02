import type { MotionDocument } from '@motion-studio/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recoverDocument } from './recover-document'

const { listDocumentIds, loadDocument, readPending } = vi.hoisted(() => ({
  listDocumentIds: vi.fn(),
  loadDocument: vi.fn(),
  readPending: vi.fn(),
}))

vi.mock('../storage/document-store', () => ({ listDocumentIds, loadDocument }))
vi.mock('../storage/pending-write', () => ({ readPending }))

const documentNamed = (name: string): MotionDocument =>
  ({ meta: { id: `doc_${name}`, name } }) as unknown as MotionDocument

describe('recovering the document after a crash', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listDocumentIds.mockResolvedValue([])
    readPending.mockReturnValue(null)
  })

  it('takes the live store when it is intact', async () => {
    const live = documentNamed('live')

    await expect(recoverDocument({ fromStore: () => live })).resolves.toEqual({
      document: live,
      source: 'store',
    })

    expect(listDocumentIds).not.toHaveBeenCalled()
  })

  /** The case the other two lanes exist for: the store is the thing that broke. */
  it('falls back to the autosave when reading the store throws', async () => {
    const saved = documentNamed('saved')

    listDocumentIds.mockResolvedValue(['doc_saved'])
    loadDocument.mockResolvedValue({ document: saved, savedAt: 10 })

    await expect(
      recoverDocument({
        fromStore: () => {
          throw new TypeError('Cannot read properties of undefined (reading getState)')
        },
      }),
    ).resolves.toEqual({ document: saved, source: 'autosave' })
  })

  it('takes the most recently saved document when a session wrote several', async () => {
    listDocumentIds.mockResolvedValue(['doc_old', 'doc_new'])
    loadDocument.mockImplementation(async (id: string) =>
      id === 'doc_old'
        ? { document: documentNamed('old'), savedAt: 1 }
        : { document: documentNamed('new'), savedAt: 99 },
    )

    const recovered = await recoverDocument({ fromStore: () => null })

    expect(recovered?.document.meta.name).toBe('new')
  })

  it('falls through to the unload lane when IndexedDB has nothing', async () => {
    const pending = documentNamed('pending')

    readPending.mockReturnValue({ document: pending, savedAt: 5 })

    await expect(recoverDocument({ fromStore: () => null })).resolves.toEqual({
      document: pending,
      source: 'unload-lane',
    })
  })

  /**
   * A private window refuses IndexedDB outright on some browsers. That is "no document here", not a
   * second failure — the unload lane still has to be tried.
   */
  it('treats a refusing IndexedDB as empty rather than as an error', async () => {
    const pending = documentNamed('pending')

    listDocumentIds.mockRejectedValue(new DOMException('denied', 'SecurityError'))
    readPending.mockReturnValue({ document: pending, savedAt: 5 })

    await expect(recoverDocument({ fromStore: () => null })).resolves.toEqual({
      document: pending,
      source: 'unload-lane',
    })
  })

  it('survives a localStorage that throws, and says there is nothing', async () => {
    readPending.mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    await expect(recoverDocument({ fromStore: () => null })).resolves.toBeNull()
  })

  it('answers null when every lane is empty', async () => {
    await expect(recoverDocument({ fromStore: () => null })).resolves.toBeNull()
  })
})
