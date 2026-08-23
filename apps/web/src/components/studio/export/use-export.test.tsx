import type { CodegenIR, ExportFile, ExportResult } from '@motion-studio/codegen'
import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import type { ExportRequest, Formatting } from './run-export'
import type { UseExportResult } from './use-export'

const FILES: readonly ExportFile[] = [
  { path: 'page.tsx', contents: 'export default function Page() {}\n' },
  { path: 'index.ts', contents: "export { Page } from './page'\n" },
]

const IR = { components: [], entry: 'Page' } as unknown as CodegenIR

const buildExportIR = vi.fn<(request: ExportRequest) => CodegenIR | null>(() => IR)

const printExport = vi.fn<(request: ExportRequest, ir: CodegenIR | null) => ExportResult>(() => ({
  files: FILES,
  warnings: [],
  dependencies: {},
}))

const loadFormatting = vi.fn<() => Promise<Formatting>>(() =>
  Promise.resolve({
    format: (file: ExportFile) => Promise.resolve({ files: [file], warnings: [] }),
    warnings: [],
  }),
)

vi.mock('./run-export', () => ({
  buildExportIR: (request: ExportRequest) => buildExportIR(request),
  printExport: (request: ExportRequest, ir: CodegenIR | null) => printExport(request, ir),
  loadFormatting: () => loadFormatting(),
  copyEntry: vi.fn(),
  printedTheme: vi.fn(),
}))

/*
 * Every test in this file re-imports the hook and, with it, the editor store's whole module graph —
 * `vi.resetModules()` below is what makes the caches testable, and it is also what makes the import
 * cost real per test. Under `pnpm test`, where fourteen packages compile at once, that import has been
 * measured past the 5 s default and failed a test that asserts nothing about time.
 */
vi.setConfig({ testTimeout: 20_000 })

/**
 * The module holds the two caches, so every test gets its own copy of it. Resetting the store's
 * document is not enough: `replaceDocument` sets `version` back to zero, which is exactly the key a
 * cache entry from the previous test would still be under.
 */
const load = async (): Promise<(open: boolean) => UseExportResult> =>
  (await import('./use-export')).useExport

let counter = 0

beforeEach(() => {
  vi.resetModules()
  buildExportIR.mockClear()
  printExport.mockClear()
  loadFormatting.mockClear()
  counter += 1
  useStudioStore
    .getState()
    .replaceDocument(createEmptyDocument({ ids: () => nodeId(`node_u${counter}`) }))
})

const ready = async (result: { current: UseExportResult }): Promise<void> => {
  await waitFor(() => expect(result.current.snapshot.status).toBe('ready'))
}

describe('useExport', () => {
  it('does nothing until the dialog is open', async () => {
    const useExport = await load()

    renderHook(() => useExport(false))

    expect(buildExportIR).not.toHaveBeenCalled()
  })

  it('streams the printed files in before they are formatted', async () => {
    const useExport = await load()
    const { result } = renderHook(() => useExport(true))

    await waitFor(() => expect(result.current.snapshot.files).toHaveLength(2))

    // The list is complete and the formatting is not: that gap is what the per-file skeletons show.
    expect(result.current.snapshot.formatted.length).toBeLessThanOrEqual(2)

    await ready(result)

    expect(result.current.snapshot.formatted).toEqual(['page.tsx', 'index.ts'])
    expect(result.current.snapshot.elapsedMs).not.toBeNull()
  })

  it('memoises a finished run: the same options generate once', async () => {
    const useExport = await load()
    const first = renderHook(() => useExport(true))

    await ready(first.result)
    first.unmount()

    const second = renderHook(() => useExport(true))

    await ready(second.result)

    expect(buildExportIR).toHaveBeenCalledTimes(1)
    expect(printExport).toHaveBeenCalledTimes(1)
  })

  it('reprints without rebuilding the IR when only the theme is toggled', async () => {
    const useExport = await load()
    const { result } = renderHook(() => useExport(true))

    await ready(result)
    result.current.setOptions({ includeTheme: false })
    await waitFor(() => expect(result.current.options.includeTheme).toBe(false))
    await ready(result)

    // ADR-244's cache split: `includeTheme` never reaches `buildIR`, so pass 1 to 6 do not run again.
    expect(printExport).toHaveBeenCalledTimes(2)
    expect(buildExportIR).toHaveBeenCalledTimes(1)
  })

  it('rebuilds the IR when an option the IR is built from changes', async () => {
    const useExport = await load()
    const { result } = renderHook(() => useExport(true))

    await ready(result)
    result.current.setOptions({ extractProps: false })
    await waitFor(() => expect(result.current.options.extractProps).toBe(false))
    await ready(result)

    expect(buildExportIR).toHaveBeenCalledTimes(2)
  })

  it('resolves the options the target fixes, so the panel can show them as fixed', async () => {
    const useExport = await load()
    const { result } = renderHook(() => useExport(true))

    result.current.setOptions({ target: 'html' })

    await waitFor(() => expect(result.current.resolved.singleFile).toBe(true))

    expect(result.current.options.singleFile).toBe(false)
    expect(result.current.resolved.imageComponent).toBe('img')
  })

  it('reports a refused export instead of leaving the dialog generating', async () => {
    buildExportIR.mockImplementationOnce(() => {
      throw new Error('No client boundary declared by hero-aurora.')
    })

    const useExport = await load()
    const { result } = renderHook(() => useExport(true))

    await waitFor(() => expect(result.current.snapshot.status).toBe('failed'))

    expect(result.current.snapshot.error).toContain('client boundary')
  })

  it('ships unformatted files with the warning when Prettier does not load', async () => {
    loadFormatting.mockResolvedValueOnce({
      format: undefined,
      warnings: [{ code: 'unsupported', message: 'Prettier could not be loaded', docsLink: 'x' }],
    })

    const useExport = await load()
    const { result } = renderHook(() => useExport(true))

    await ready(result)

    expect(result.current.snapshot.warnings).toHaveLength(1)
    expect(result.current.snapshot.files).toHaveLength(2)
  })
})
