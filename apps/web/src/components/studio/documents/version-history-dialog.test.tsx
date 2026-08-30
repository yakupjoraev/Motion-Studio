import { commands } from '@motion-studio/editor'
import { createEmptyDocument } from '@motion-studio/schema'
import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SNAPSHOT_LIMIT, takeSnapshot } from '../../../lib/storage/document-store'
import { useStudioStore } from '../../../store/editor-store'

import { openDialog, renderWithDocuments, resetStorage } from './test-utils'
import { VersionHistoryDialog } from './version-history-dialog'

const openDocument = () => useStudioStore.getState().document

beforeEach(() => {
  resetStorage()
  useStudioStore.getState().replaceDocument(createEmptyDocument({ name: 'Versioned' }))
  openDialog('version-history')
})

afterEach(() => {
  useStudioStore.getState().setActiveDialog(null)
})

describe('the version history dialog', () => {
  it('says so when there is nothing to restore', async () => {
    renderWithDocuments(<VersionHistoryDialog />)

    expect(await screen.findByText(/No versions yet/)).toBeInTheDocument()
  })

  it('lists the ring buffer, newest first, with a node count each', async () => {
    for (let index = 0; index < SNAPSHOT_LIMIT + 3; index += 1) {
      await takeSnapshot(openDocument(), 1000 + index)
    }

    renderWithDocuments(<VersionHistoryDialog />)

    const rows = await screen.findAllByRole('listitem')

    expect(rows).toHaveLength(SNAPSHOT_LIMIT)
    expect(rows[0]).toHaveTextContent('Latest')
    expect(rows[0]).toHaveTextContent('1 blocks')
  })

  it('restores a version as an undoable command', async () => {
    await takeSnapshot(openDocument(), 1000)

    act(() => {
      useStudioStore
        .getState()
        .dispatch(commands.setDocumentMeta({ path: 'name', value: 'Edited' }))
    })

    renderWithDocuments(<VersionHistoryDialog />)

    const restore = await screen.findByRole('button', { name: 'Restore' })

    await act(async () => {
      restore.click()
    })

    await waitFor(() => {
      expect(openDocument().meta.name).toBe('Versioned')
    })

    act(() => {
      useStudioStore.getState().undo()
    })

    expect(openDocument().meta.name).toBe('Edited')
  })

  it('keeps the document’s identity through a restore', async () => {
    const id = openDocument().meta.id

    await takeSnapshot(openDocument(), 1000)

    renderWithDocuments(<VersionHistoryDialog />)

    const restore = await screen.findByRole('button', { name: 'Restore' })

    await act(async () => {
      restore.click()
    })

    await waitFor(() => {
      expect(openDocument().meta.id).toBe(id)
    })
  })
})
