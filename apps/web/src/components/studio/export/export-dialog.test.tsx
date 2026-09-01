import type { CodegenIR, ExportFile, ExportResult, IRWarning } from '@motion-studio/codegen'
import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { ToastProvider } from '@motion-studio/ui'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { ExportDialog } from './export-dialog'
import type { ExportRequest, Formatting } from './run-export'

const FILES: readonly ExportFile[] = [
  { path: 'app/page.tsx', contents: 'export default function Page() {}\n' },
  { path: 'package.json', contents: '{}\n' },
]

/** The node has to be one the document holds: the selection slice drops ids it does not know. */
const warnings = (): readonly IRWarning[] => [
  {
    code: 'missing-alt',
    message: 'Screenshot has no alt text',
    nodeId: useStudioStore.getState().document.rootId,
    docsLink: 'docs/ACCESSIBILITY.md',
  },
]

/** Held open by the formatter so the streaming state is a state a test can look at. */
let release: (() => void) | null = null

const formatting: Formatting = {
  format: (file: ExportFile) =>
    new Promise((resolve) => {
      release = () => resolve({ files: [file], warnings: [] })
    }),
  warnings: [],
}

const printExport = vi.fn<(request: ExportRequest, ir: CodegenIR | null) => ExportResult>(() => ({
  files: FILES,
  warnings: warnings(),
  dependencies: {},
}))

vi.mock('./run-export', () => ({
  buildExportIR: () => ({ components: [], entry: 'Page' }) as unknown as CodegenIR,
  printExport: (request: ExportRequest, ir: CodegenIR | null) => printExport(request, ir),
  loadFormatting: () => Promise.resolve(formatting),
  copyEntry: vi.fn(),
  printedTheme: vi.fn(),
}))

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 320 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.resolve() },
  })
})

let counter = 0

const state = () => useStudioStore.getState()

/*
 * The two panels ADR-313 put behind a lazy boundary, warmed before the first render — which is the
 * state a real dialog opens in, because the shell prefetches both on idle. Without this the panels
 * resolve after the mocked export has already produced files, and the pending placeholder that this
 * file asserts on becomes unobservable for a reason that has nothing to do with the dialog.
 */
/*
 * The two dialog panels are `dynamic()` (ADR-313), so the first render waits on Vitest transforming
 * them and everything they import. On a machine running the whole suite that has twice exceeded the
 * 10 s default and failed the file — the timeout is the hook's own, not the app's.
 */
beforeAll(async () => {
  await Promise.all([import('./options-panel'), import('./file-tree')])
}, 60_000)

beforeEach(() => {
  counter += 1
  release = null
  printExport.mockClear()
  state().replaceDocument(createEmptyDocument({ ids: () => nodeId(`node_d${counter}`) }))
  state().setExportDialogOpen(true)
})

const view = () => render(<ExportDialog />, { wrapper: ToastProvider })

describe('ExportDialog', () => {
  it('is on screen with its controls before a single file has been generated', () => {
    view()

    /*
     * Nothing is awaited: this is the first render, and the pipeline has not been imported yet.
     *
     * The skeleton file list is asserted by `file-tree.test.tsx` instead. ADR-313 put the list behind
     * a lazy boundary, and by the time it mounts the mocked pipeline has already produced its files —
     * so the placeholder is FileTree's behaviour to prove, not this dialog's.
     */
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /React/ })).toBeChecked()
    expect(screen.getByTestId('export-status')).toHaveTextContent('Generating…')
  })

  it('shows the file list while the formatting of it is still running', async () => {
    view()

    const tree = await screen.findByRole('tree', { name: 'Generated files' })

    expect(within(tree).getAllByRole('treeitem')).toHaveLength(2)
    expect(screen.getByTestId('export-viewer-skeleton')).toBeInTheDocument()
  })

  it('puts the warnings above the code, grouped and counted', async () => {
    view()

    const group = await screen.findByRole('button', { name: /Missing alt text/ })

    expect(within(group).getByText('1')).toBeInTheDocument()
  })

  it('closes and selects the node a warning is about', async () => {
    const user = userEvent.setup()
    const root = state().document.rootId

    view()

    await user.click(await screen.findByRole('button', { name: 'Select it' }))

    expect(state().ui.exportDialogOpen).toBe(false)
    expect(state().selection.ids).toEqual([root])
  })

  it('regenerates when a target is chosen, and says how long it took', async () => {
    const user = userEvent.setup()

    view()

    await screen.findByRole('tree', { name: 'Generated files' })
    release?.()
    release?.()

    await user.click(screen.getByRole('radio', { name: /HTML/ }))

    await waitFor(() => expect(printExport).toHaveBeenCalledTimes(2))

    // ADR-237 and ADR-242: HTML fixes both controls, and the panel says so rather than offering them.
    const single = screen.getByRole('switch', { name: 'Single file' })

    expect(single).toBeDisabled()
    expect(single).toHaveAccessibleDescription(/HTML is one document/)
  })

  it('reads the code in a labelled region the keyboard can reach', async () => {
    view()

    await screen.findByRole('tree', { name: 'Generated files' })
    release?.()

    const region = await screen.findByRole('region', { name: /app\/page\.tsx/ })

    expect(region).toHaveAttribute('tabindex', '0')
  })
})
