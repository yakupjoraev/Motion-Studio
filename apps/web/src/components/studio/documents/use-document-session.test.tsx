import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { ToastProvider } from '@motion-studio/ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { useDocumentSession } from './use-document-session'

/**
 * Storage and the file writer are stubbed, and nothing else — TESTING.md § Component tests. jsdom has
 * no IndexedDB, so the two lanes have to answer from somewhere, and a download is only observable
 * where the browser is handed the bytes. The last-open id is real: it lives in `localStorage`.
 */
const { flushPending, loadDocument, loadRawDocument, downloadText } = vi.hoisted(() => ({
  flushPending: vi.fn(),
  loadDocument: vi.fn(),
  loadRawDocument: vi.fn(),
  downloadText: vi.fn(),
}))

vi.mock('../../../lib/storage/pending-write', () => ({ flushPending }))
vi.mock('../../../lib/storage/document-store', () => ({ loadDocument, loadRawDocument }))
vi.mock('../../../lib/documents/download', () => ({ downloadText }))

const LAST_OPEN_KEY = 'motion-studio.last-open'

const stored = createEmptyDocument({
  name: 'Yesterday',
  ids: () => nodeId('node_s1'),
  now: () => new Date(0),
})

function Session(): null {
  useDocumentSession()

  return null
}

const view = () => render(<Session />, { wrapper: ToastProvider })

beforeEach(() => {
  vi.resetAllMocks()
  // Radix's toast reads it on the pointer events a click produces; jsdom has no implementation.
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  window.localStorage.clear()
  flushPending.mockResolvedValue(null)
  loadDocument.mockResolvedValue(undefined)
  loadRawDocument.mockResolvedValue(undefined)
})

describe('restoring the last session', () => {
  it('opens the document the last-open id names', async () => {
    window.localStorage.setItem(LAST_OPEN_KEY, 'doc_1')
    loadDocument.mockResolvedValue({ document: stored, savedAt: 10 })

    view()

    await vi.waitFor(() => expect(useStudioStore.getState().document.meta.name).toBe('Yesterday'))
    expect(window.localStorage.getItem(LAST_OPEN_KEY)).toBe('doc_1')
  })

  /**
   * The failure a user reads as "my work is gone": a stored record this build's schema rejects. The
   * studio opens empty either way — the difference is whether it says so.
   */
  it('says so when the stored record cannot be read, and offers the bytes', async () => {
    window.localStorage.setItem(LAST_OPEN_KEY, 'doc_corrupt')
    loadRawDocument.mockResolvedValue({ document: { version: 1, meta: 'not an object' } })

    view()

    expect(await screen.findByText('Your last document could not be opened')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Download it' }))

    expect(downloadText).toHaveBeenCalledTimes(1)
    expect(downloadText.mock.calls[0]?.[1]).toBe('doc_corrupt.motion.json')
    expect(String(downloadText.mock.calls[0]?.[0])).toContain('not an object')
  })

  /** A last-open id pointing at a deleted document is ordinary, and a toast for it would be noise. */
  it('stays quiet when the record is simply gone', async () => {
    window.localStorage.setItem(LAST_OPEN_KEY, 'doc_deleted')

    view()

    await vi.waitFor(() => expect(loadRawDocument).toHaveBeenCalledWith('doc_deleted'))
    expect(screen.queryByText('Your last document could not be opened')).toBeNull()
  })

  it('restores nothing when no session was ever saved', async () => {
    view()

    await vi.waitFor(() => expect(flushPending).toHaveBeenCalledTimes(1))
    expect(loadDocument).not.toHaveBeenCalled()
  })
})
