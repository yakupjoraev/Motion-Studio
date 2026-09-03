import type { CodegenIR, ExportResult, IRWarning } from '@motion-studio/codegen'
import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { ToastProvider } from '@motion-studio/ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { ExportDialog } from './export-dialog'

/**
 * The export boundary, tested by all three ways an export fails: the printer throwing, the formatter
 * throwing after the warnings are known, and the dialog's own body throwing — which only the boundary
 * catches. The user gets the same state for all three — `prompts/58` § The five boundaries.
 */
const { fails, viewerThrows } = vi.hoisted(() => ({
  fails: { print: true, format: false },
  viewerThrows: { value: false },
}))

const WARNING: IRWarning = {
  code: 'missing-alt',
  message: 'Screenshot has no alt text',
  nodeId: nodeId('node_d1'),
  docsLink: 'docs/ACCESSIBILITY.md',
}

vi.mock('./run-export', () => ({
  buildExportIR: () => ({ components: [], entry: 'Page' }) as unknown as CodegenIR,
  printExport: (): ExportResult => {
    if (fails.print) {
      throw new TypeError('Cannot print a slot child of an unknown block')
    }

    return {
      files: [{ path: 'app/page.tsx', contents: 'x' }],
      warnings: [WARNING],
      dependencies: {},
    }
  },
  loadFormatting: () =>
    Promise.resolve(
      fails.format
        ? {
            warnings: [],
            format: () => {
              throw new TypeError('Prettier could not parse the printed file')
            },
          }
        : { warnings: [] },
    ),
  copyEntry: vi.fn(),
  printedTheme: vi.fn(),
}))

/** Statically imported by the dialog, and always rendered — the cheapest deliberate throw in its body. */
vi.mock('./code-viewer', () => ({
  CodeViewer: () => {
    if (viewerThrows.value) {
      throw new TypeError('the highlighter has no grammar for this file')
    }

    return <p>code viewer</p>
  },
}))

const writeText = vi.fn((_text: string) => Promise.resolve())

beforeAll(async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  // ADR-313 put both panels behind `dynamic()`; warmed so the first render is the state a real dialog
  // opens in, where the shell has already prefetched them.
  await Promise.all([import('./options-panel'), import('./file-tree')])
}, 60_000)

let consoleError: ReturnType<typeof vi.spyOn>
let counter = 0

beforeEach(() => {
  counter += 1
  fails.print = true
  fails.format = false
  viewerThrows.value = false
  writeText.mockClear()
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  useStudioStore
    .getState()
    .replaceDocument(createEmptyDocument({ ids: () => nodeId(`node_e${counter}`) }))
  useStudioStore.getState().setExportDialogOpen(true)
})

afterEach(() => {
  consoleError.mockRestore()
})

const view = () => render(<ExportDialog />, { wrapper: ToastProvider })

describe('the export dialog boundary', () => {
  it('reports a printer that threw, and says nothing was written', async () => {
    view()

    expect(await screen.findByTestId('export-error')).toHaveTextContent(
      'The export failed while printing. Nothing was written.',
    )
    expect(screen.getByTestId('export-status')).toHaveTextContent('Export failed')
  })

  /** The escape hatch that needs no printer: the document is already JSON. */
  it('copies the document as JSON instead', async () => {
    view()

    await userEvent.click(await screen.findByRole('button', { name: 'Copy JSON instead' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(JSON.parse(writeText.mock.calls[0]?.[0] ?? '{}')).toMatchObject({ version: 1 })
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('offers the document download too', async () => {
    view()

    expect(await screen.findByRole('button', { name: 'Download document' })).toBeInTheDocument()
  })

  it('catches a body that throws and gives it the same state', async () => {
    fails.print = false
    viewerThrows.value = true

    view()

    expect(await screen.findByTestId('export-error')).toHaveTextContent(
      'Copy the document as JSON instead',
    )
    expect(consoleError.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      '[export-dialog]',
    )
  })

  /** A printer usually throws on something the IR already doubted — that list is the closest cause. */
  it('keeps the warnings the run had already raised when a later stage throws', async () => {
    fails.print = false
    fails.format = true

    view()

    expect(await screen.findByTestId('export-error-warnings')).toHaveTextContent(
      'Screenshot has no alt text',
    )
    expect(screen.getByTestId('export-status')).toHaveTextContent('Export failed')
  })
})
