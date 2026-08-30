import { createEmptyDocument } from '@motion-studio/schema'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { entryOf, readIndex, upsertEntry } from '../../../lib/storage/document-index'
import {
  listDocumentIds,
  listSnapshots,
  loadDocument,
  saveDocument,
  takeSnapshot,
} from '../../../lib/storage/document-store'
import { useStudioStore } from '../../../store/editor-store'

import { DocumentListDialog } from './document-list-dialog'
import { openDialog, renderWithDocuments, resetStorage } from './test-utils'

const seed = async (name: string, at: number): Promise<string> => {
  const document = createEmptyDocument({ name })

  await saveDocument(document, at)
  upsertEntry(entryOf(document, at))

  return document.meta.id
}

beforeEach(() => {
  resetStorage()
  openDialog('documents')
})

afterEach(() => {
  useStudioStore.getState().setActiveDialog(null)
})

describe('the document list', () => {
  it('says so when there is nothing saved', async () => {
    renderWithDocuments(<DocumentListDialog />)

    expect(await screen.findByText(/No documents yet/)).toBeInTheDocument()
  })

  it('lists what is stored, newest first', async () => {
    await seed('Older', 1000)
    await seed('Newer', 2000)

    renderWithDocuments(<DocumentListDialog />)

    const rows = await screen.findAllByRole('listitem')

    expect(rows[0]).toHaveTextContent('Newer')
    expect(rows[1]).toHaveTextContent('Older')
  })

  it('opens a document into the store', async () => {
    const id = await seed('Landing', 1000)

    renderWithDocuments(<DocumentListDialog />)

    const target = await screen.findByText('Landing')

    await act(async () => {
      target.click()
    })

    await waitFor(() => {
      expect(useStudioStore.getState().document.meta.id).toBe(id)
    })
  })

  it('renames both the index and the stored document', async () => {
    const id = await seed('Before', 1000)

    renderWithDocuments(<DocumentListDialog />)

    const target = await screen.findByRole('button', { name: 'Rename Before' })

    await act(async () => {
      target.click()
    })

    const field = await screen.findByLabelText('Document name')

    await act(async () => {
      await userEvent.clear(field)
      await userEvent.type(field, 'After')
      field.blur()
    })

    await waitFor(async () => {
      expect(readIndex()[0]?.name).toBe('After')
      expect((await loadDocument(id))?.document.meta.name).toBe('After')
    })
  })

  it('duplicates into a second document with its own id', async () => {
    const id = await seed('Original', 1000)

    renderWithDocuments(<DocumentListDialog />)

    const target = await screen.findByRole('button', { name: 'Duplicate Original' })

    await act(async () => {
      target.click()
    })

    await waitFor(async () => {
      const stored = await listDocumentIds()

      expect(stored).toHaveLength(2)
      expect(stored).toContain(id)
    })

    expect(await screen.findByText('Original copy')).toBeInTheDocument()
  })

  it('deletes with an undo toast rather than a confirmation dialog', async () => {
    const id = await seed('Doomed', 1000)

    renderWithDocuments(<DocumentListDialog />)

    const target = await screen.findByRole('button', { name: 'Delete Doomed' })

    await act(async () => {
      target.click()
    })

    await waitFor(async () => {
      expect(await loadDocument(id)).toBeUndefined()
    })

    expect(screen.getByText('Deleted Doomed')).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: 'Undo' }).click()
    })

    await waitFor(async () => {
      expect((await loadDocument(id))?.document.meta.name).toBe('Doomed')
    })
  })

  it('brings the version history back with the document', async () => {
    const id = await seed('Versioned', 1000)
    const stored = await loadDocument(id)

    if (stored === undefined) {
      throw new Error('the seed did not store')
    }

    await takeSnapshot(stored.document, 900)
    await takeSnapshot(stored.document, 950)

    renderWithDocuments(<DocumentListDialog />)

    const target = await screen.findByRole('button', { name: 'Delete Versioned' })

    await act(async () => {
      target.click()
    })

    await waitFor(async () => {
      expect(await listSnapshots(id)).toHaveLength(0)
    })

    await act(async () => {
      screen.getByRole('button', { name: 'Undo' }).click()
    })

    // An undo that returned the document without its history would be an undo that lost something.
    await waitFor(async () => {
      expect((await listSnapshots(id)).map((snapshot) => snapshot.createdAt)).toEqual([950, 900])
    })
  })
})
