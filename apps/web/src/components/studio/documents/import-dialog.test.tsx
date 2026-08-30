import { doc, nodeId, serializeDocument, tree, treeId } from '@motion-studio/schema'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { ImportDialog } from './import-dialog'
import { openDialog, renderWithDocuments, resetStorage } from './test-utils'

const downloads = vi.hoisted(() => ({ text: vi.fn() }))

vi.mock('../../../lib/documents/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/documents/download')>()),
  downloadText: downloads.text,
}))

const clean = () => doc(tree({ root: ['a', 'b'] }))

/** The picker's `input` is the shortest path in: a drop and a paste reach the same `read`. */
const choose = async (contents: string, name = 'page.motion.json'): Promise<void> => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')

  if (input === null) {
    throw new Error('the dialog has no file input')
  }

  await act(async () => {
    await userEvent.upload(input, new File([contents], name, { type: 'application/json' }))
  })
}

beforeEach(() => {
  resetStorage()
  downloads.text.mockClear()
  openDialog('import')
})

afterEach(() => {
  useStudioStore.getState().setActiveDialog(null)
})

describe('the import dialog', () => {
  it('offers a drop zone and a picker before anything is chosen', () => {
    renderWithDocuments(<ImportDialog />)

    expect(screen.getByTestId('import-dropzone')).toBeInTheDocument()
  })

  it('reports a clean file as needing no repairs', async () => {
    renderWithDocuments(<ImportDialog />)
    await choose(serializeDocument(clean()))

    expect(await screen.findByText(/Nothing needed repairing/)).toBeInTheDocument()
  })

  it('lists every repair with its count before the document is adopted', async () => {
    const orphaned = doc([...tree({ root: ['a'] }), ...tree({ loose: ['stray'] })])
    const before = useStudioStore.getState().document.meta.id

    renderWithDocuments(<ImportDialog />)
    await choose(serializeDocument(orphaned))

    expect(await screen.findByText('2 orphan blocks removed')).toBeInTheDocument()
    // Nothing has been adopted yet: the report is a decision point, not a summary of what happened.
    expect(useStudioStore.getState().document.meta.id).toBe(before)
  })

  it('adopts the document on Continue', async () => {
    renderWithDocuments(<ImportDialog />)
    await choose(serializeDocument(clean()))

    const button = await screen.findByRole('button', { name: 'Continue' })

    await act(async () => {
      button.click()
    })

    await waitFor(() => {
      expect(useStudioStore.getState().document.meta.id).toBe(clean().meta.id)
    })
  })

  it('hands back the unmodified file, so a repair cannot destroy the only copy', async () => {
    const orphaned = doc([...tree({ root: ['a'] }), ...tree({ loose: ['stray'] })])
    const original = serializeDocument(orphaned)

    renderWithDocuments(<ImportDialog />)
    await choose(original, 'broken.motion.json')

    const button = await screen.findByRole('button', { name: 'Download original' })

    await act(async () => {
      button.click()
    })

    expect(downloads.text).toHaveBeenCalledWith(original, 'broken.motion.json')
  })

  it('explains a rejection and imports nothing', async () => {
    const cyclic = doc(tree({ root: ['a'], a: ['b'], b: ['a'] }))
    const before = useStudioStore.getState().document.meta.id

    renderWithDocuments(<ImportDialog />)
    await choose(serializeDocument(cyclic))

    expect(await screen.findByText('This document contains a loop')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
    expect(useStudioStore.getState().document.meta.id).toBe(before)
  })

  it('offers the download on a rejection too', async () => {
    const rootless = { ...clean(), rootId: nodeId('node_missing') }

    renderWithDocuments(<ImportDialog />)
    await choose(serializeDocument(rootless))

    expect(await screen.findByRole('button', { name: 'Download original' })).toBeInTheDocument()
  })

  it('reads malformed JSON as a readable error and leaves the document alone', async () => {
    const before = useStudioStore.getState().document.meta.id

    renderWithDocuments(<ImportDialog />)
    await choose('{\n  "version": 1,\n  oops\n}')

    expect(await screen.findByText('Not valid JSON (line 3)')).toBeInTheDocument()
    expect(screen.getByText('The document you have open was not touched.')).toBeInTheDocument()
    expect(useStudioStore.getState().document.meta.id).toBe(before)
  })

  it('keeps a block it does not know, and says it will render as a placeholder', async () => {
    const base = doc(tree({ root: ['a'] }))
    const foreign = {
      ...base,
      nodes: {
        ...base.nodes,
        [treeId('a')]: { ...base.nodes[treeId('a')], blockId: 'custom-hero' },
      },
    }

    renderWithDocuments(<ImportDialog />)
    await choose(JSON.stringify(foreign))

    expect(
      await screen.findByText('1 block is not available and renders as a placeholder'),
    ).toBeInTheDocument()
  })
})
