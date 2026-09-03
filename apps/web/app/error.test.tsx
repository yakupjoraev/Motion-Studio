import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RouteError from './error'

const { getState, listDocumentIds, loadDocument, readPending } = vi.hoisted(() => ({
  getState: vi.fn(),
  listDocumentIds: vi.fn(),
  loadDocument: vi.fn(),
  readPending: vi.fn(),
}))

vi.mock('../src/store/editor-store', () => ({ useStudioStore: { getState } }))
vi.mock('../src/lib/storage/document-store', () => ({ listDocumentIds, loadDocument }))
vi.mock('../src/lib/storage/pending-write', () => ({ readPending }))

let saved: Blob[]
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.resetAllMocks()
  saved = []
  URL.createObjectURL = vi.fn((blob: Blob) => {
    saved.push(blob)

    return '#downloaded'
  })
  URL.revokeObjectURL = vi.fn()
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  // A page that threw may never have mounted the store, which is the case this boundary is for.
  getState.mockReturnValue({ document: null })
  listDocumentIds.mockResolvedValue([])
  readPending.mockReturnValue(null)
})

afterEach(() => {
  consoleError.mockRestore()
})

const view = (digest?: string) => {
  const error: Error & { digest?: string } = Object.assign(
    new TypeError('blocks.map is not a function'),
    digest === undefined ? {} : { digest },
  )

  return render(<RouteError error={error} reset={vi.fn()} />)
}

describe('the route boundary', () => {
  it('says what happened and where the user can go instead', () => {
    view()

    expect(screen.getByRole('heading', { name: 'This page stopped working' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Go to blocks' })).toHaveAttribute('href', '/blocks')
  })

  /** The route's own escape hatch: the autosave, because the store may never have mounted. */
  it('downloads the autosaved document', async () => {
    listDocumentIds.mockResolvedValue(['doc_1'])
    loadDocument.mockResolvedValue({
      document: createEmptyDocument({
        name: 'Autosaved page',
        ids: () => nodeId('node_r1'),
        now: () => new Date(0),
      }),
      savedAt: 10,
    })

    view()
    await userEvent.click(screen.getByRole('button', { name: 'Download saved document' }))

    expect(await screen.findByText('Downloaded from the last autosave.')).toBeInTheDocument()
    expect(JSON.parse(await (saved[0] as Blob).text())).toMatchObject({
      meta: { name: 'Autosaved page' },
    })
  })

  it('carries the digest as the report code, which is what a server error is identified by', async () => {
    view('e7c1a9')

    await userEvent.click(screen.getByRole('button', { name: /Details/ }))

    expect(screen.getByText(/Code: e7c1a9/)).toBeInTheDocument()
  })

  it('logs one line, and it is the report', () => {
    view()

    const logged = consoleError.mock.calls.map((call) => String(call[0])).join('\n')

    expect(logged).toContain('[route]')
    expect(logged).toContain('blocks.map is not a function')
  })
})
