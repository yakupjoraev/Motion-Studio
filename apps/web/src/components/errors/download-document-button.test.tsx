import { blockRegistry } from '@motion-studio/blocks'
import { type MotionDocument, createEmptyDocument } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { importDocument } from '../../lib/documents/import-document'
import { useStudioStore } from '../../store/editor-store'
import { DownloadDocumentButton } from './download-document-button'

/**
 * Three failures are injected here, and nothing else is stubbed — TESTING.md § Component tests: the
 * store that throws when it is read is the case this button exists for, and IndexedDB is absent in
 * jsdom, so its two lanes have to answer from somewhere.
 */
const { listDocumentIds, loadDocument, readPending } = vi.hoisted(() => ({
  listDocumentIds: vi.fn(),
  loadDocument: vi.fn(),
  readPending: vi.fn(),
}))

vi.mock('../../lib/storage/document-store', () => ({ listDocumentIds, loadDocument }))
vi.mock('../../lib/storage/pending-write', () => ({ readPending }))

const documentNamed = (name: string): MotionDocument =>
  createEmptyDocument({ name, ids: (prefix) => `${prefix}_fixed`, now: () => new Date(0) })

/** What the browser was handed. `URL.createObjectURL` is where a download becomes observable. */
let saved: Blob[]

const realGetState = useStudioStore.getState

/** The store as it is when the boundary above it caught something the store itself survived. */
const storeHolds = (document: MotionDocument): void => {
  useStudioStore.getState().replaceDocument(document)
}

/** The failure the button is for: reading the store throws. */
const storeIsGone = (): void => {
  useStudioStore.getState = () => {
    throw new TypeError('Cannot read properties of undefined (reading document)')
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  useStudioStore.getState = realGetState
  saved = []
  // A hash, not a `blob:` URL: the anchor is clicked for real, and jsdom implements no navigation
  // other than a hash change.
  URL.createObjectURL = vi.fn((blob: Blob) => {
    saved.push(blob)

    return '#downloaded'
  })
  URL.revokeObjectURL = vi.fn()

  listDocumentIds.mockResolvedValue([])
  readPending.mockReturnValue(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const clickDownload = async (): Promise<void> => {
  render(<DownloadDocumentButton />)
  await userEvent.click(screen.getByRole('button', { name: 'Download document' }))
}

/** The file is only an escape hatch if it opens again — FILE_FORMAT.md § Import. */
const reimport = async (): Promise<MotionDocument> => {
  const text = await (saved[0] as Blob).text()
  const outcome = importDocument(text, blockRegistry)

  if (!outcome.ok) {
    throw new Error(`the recovered file did not re-import: ${outcome.error.title}`)
  }

  return outcome.value.document
}

describe('the download escape hatch', () => {
  it('writes the live document and says the session is where it came from', async () => {
    storeHolds(documentNamed('Live session'))

    await clickDownload()

    expect(await screen.findByText('Downloaded from this session.')).toBeInTheDocument()
    expect((await reimport()).meta.name).toBe('Live session')
  })

  /** The case the button exists for: the store is the thing that broke. */
  it('falls back to the autosave when reading the store throws', async () => {
    storeIsGone()
    listDocumentIds.mockResolvedValue(['doc_1'])
    loadDocument.mockResolvedValue({ document: documentNamed('Autosaved'), savedAt: 10 })

    await clickDownload()

    expect(await screen.findByText('Downloaded from the last autosave.')).toBeInTheDocument()
    expect((await reimport()).meta.name).toBe('Autosaved')
  })

  it('falls back to the unload lane when IndexedDB has nothing', async () => {
    storeIsGone()
    readPending.mockReturnValue({ document: documentNamed('Before the tab closed'), savedAt: 5 })

    await clickDownload()

    expect(
      await screen.findByText('Downloaded from the last save before the tab closed.'),
    ).toBeInTheDocument()
    expect((await reimport()).meta.name).toBe('Before the tab closed')
  })

  it('says so plainly when there is nothing anywhere, rather than downloading an empty file', async () => {
    storeIsGone()

    await clickDownload()

    expect(
      await screen.findByText('No document could be recovered from this browser.'),
    ).toBeInTheDocument()
    expect(saved).toHaveLength(0)
  })
})
