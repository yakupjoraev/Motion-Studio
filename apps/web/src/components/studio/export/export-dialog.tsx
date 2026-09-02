'use client'

import type { ExportFile } from '@motion-studio/codegen'
import type { NodeId } from '@motion-studio/schema'
import { Dialog, useToast } from '@motion-studio/ui'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { DialogErrorState } from '../../errors/dialog-error-state'
import { ErrorBoundary } from '../../errors/error-boundary'

import { CodeViewer } from './code-viewer'
import { DownloadActions } from './download-actions'
import { TargetSelector } from './target-selector'
import { useExport } from './use-export'
import { WarningsList } from './warnings-list'

/**
 * The two children with a graph behind them, fetched on idle rather than on the click — ADR-313.
 *
 * `OptionsPanel` reaches `@motion-studio/ui/controls`, which is 26 field components and their Radix
 * packages, and `FileTree` reaches the virtualizer. Both render only inside an open dialog, and both
 * are in memory long before the button is pressed, so "visible in the frame the button is pressed"
 * still holds — it is the *click* that cannot afford a request, not the session.
 */
const OptionsPanel = dynamic(() => import('./options-panel').then((module) => module.OptionsPanel))

const FileTree = dynamic(() => import('./file-tree').then((module) => module.FileTree))

const prefetchExportPanels = (): void => {
  void import('./options-panel')
  void import('./file-tree')
}

/**
 * The export surface — EXPORT_ENGINE.md § Export dialog.
 *
 * Mounted always so a reopen shows the previous run rather than regenerating it. Its own code is in
 * the studio chunk; the four heavy modules PERFORMANCE.md § Mandatory dynamic imports names —
 * `codegen`, Prettier, `jszip` and the highlighter — are behind an `import()` in `run-export`,
 * `download-actions` and `code-viewer`, and its two heaviest children are prefetched on idle.
 */
export function ExportDialog() {
  const open = useStudioStore((state) => state.ui.exportDialogOpen)
  const documentName = useStudioStore((state) => state.document.meta.name)
  const setOpen = useStudioStore((state) => state.setExportDialogOpen)
  const notify = useToast()
  const { options, resolved, snapshot, setOptions } = useExport(open)
  const [chosen, setChosen] = useState<string | null>(null)

  useEffect(() => {
    if (typeof requestIdleCallback !== 'function') {
      prefetchExportPanels()

      return
    }

    const handle = requestIdleCallback(prefetchExportPanels, { timeout: 2000 })

    return () => cancelIdleCallback(handle)
  }, [])

  const formatted = useMemo(() => new Set(snapshot.formatted), [snapshot.formatted])

  // A path chosen in the previous run stays chosen when the new run has it, and falls back to the
  // first file when it does not — switching React to Next keeps you on `page.tsx` if it is still there.
  const held = snapshot.files.some((file) => file.path === chosen) ? chosen : null
  const selectedPath = held ?? snapshot.files[0]?.path ?? null
  const selected = snapshot.files.find((file) => file.path === selectedPath) ?? null

  const copy = useCallback(
    (text: string, title: string): void => {
      navigator.clipboard.writeText(text).then(
        () => notify({ title }),
        () => notify({ title: 'Nothing was copied', tone: 'danger' }),
      )
    },
    [notify],
  )

  const copyFile = useCallback(
    (file: ExportFile) => copy(file.contents, `Copied ${file.path}`),
    [copy],
  )

  const copyAll = useCallback(() => {
    const all = snapshot.files.map((file) => `// ${file.path}\n${file.contents}`).join('\n\n')

    copy(all, `Copied ${snapshot.files.length} files`)
  }, [copy, snapshot.files])

  /**
   * The escape hatch behind a failed export — `prompts/58` § The five boundaries.
   *
   * The document is JSON already, so this needs no printer, no worker and no IR: whatever broke in
   * the generation, the thing the user came for is one clipboard write away.
   */
  const copyDocumentJson = useCallback(async (): Promise<void> => {
    const document = useStudioStore.getState().document

    await navigator.clipboard.writeText(JSON.stringify(document, null, 2))
    notify({ title: 'Copied the document as JSON' })
  }, [notify])

  /** Re-runs the generation with the options that are already chosen. */
  const regenerate = useCallback(() => setOptions({}), [setOptions])

  /** ACCESSIBILITY.md § Dialogs: closing returns focus to the trigger, which Radix does for us. */
  const selectNode = useCallback(
    (id: NodeId) => {
      setOpen(false)
      useStudioStore.getState().select([id], 'replace')
    },
    [setOpen],
  )

  const busy = snapshot.status === 'generating'

  return (
    <Dialog
      description="Generated from the document in the canvas. Warnings first, then the code."
      onOpenChange={setOpen}
      open={open}
      size="lg"
      title="Export"
      footer={
        <>
          <span
            className="mr-auto text-2xs text-foreground-subtle tabular-nums"
            data-testid="export-status"
          >
            {snapshot.status === 'failed'
              ? 'Export failed'
              : snapshot.elapsedMs === null
                ? 'Generating…'
                : `${snapshot.files.length} files in ${Math.round(snapshot.elapsedMs)} ms`}
          </span>

          <DownloadActions
            disabled={snapshot.files.length === 0}
            documentName={documentName}
            files={snapshot.files}
            onCopyAll={copyAll}
            selected={selected}
          />
        </>
      }
    >
      <ErrorBoundary
        describeDocument={() => useStudioStore.getState().document ?? null}
        fallback={({ report, reset }) => (
          <DialogErrorState
            onCopyJson={copyDocumentJson}
            onRetry={reset}
            report={report}
            warnings={snapshot.warnings.map((warning) => warning.message)}
          />
        )}
        where="export-dialog"
      >
        <div className="grid min-h-[420px] grid-cols-[212px_1fr] gap-3" data-testid="export-dialog">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-border border-r pr-3">
            <TargetSelector onChange={(target) => setOptions({ target })} value={resolved.target} />
            <OptionsPanel onChange={setOptions} options={options} resolved={resolved} />
          </div>

          <div className="flex min-h-0 flex-col gap-2">
            {snapshot.error === null ? (
              <WarningsList onSelectNode={selectNode} warnings={snapshot.warnings} />
            ) : (
              /*
               * A printer that threw and a printer that reported a failure are the same thing to the
               * user, so they get the same state: the warnings the IR had already raised, and the
               * escape hatch that needs no printer at all — `prompts/58` § The five boundaries.
               */
              <DialogErrorState
                onCopyJson={copyDocumentJson}
                onRetry={regenerate}
                report={snapshot.error}
                warnings={snapshot.warnings.map((warning) => warning.message)}
              />
            )}

            <CodeViewer
              file={selected}
              onCopy={copyFile}
              ready={selected !== null && formatted.has(selected.path)}
            />

            <div className="max-h-40 shrink-0">
              <FileTree
                files={snapshot.files}
                formatted={snapshot.formatted}
                onCopy={copyFile}
                onSelect={setChosen}
                pending={busy}
                selected={selectedPath}
              />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Dialog>
  )
}
