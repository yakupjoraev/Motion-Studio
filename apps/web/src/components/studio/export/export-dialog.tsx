'use client'

import type { ExportFile } from '@motion-studio/codegen'
import type { NodeId } from '@motion-studio/schema'
import { Dialog, useToast } from '@motion-studio/ui'
import { useCallback, useMemo, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { CodeViewer } from './code-viewer'
import { DownloadActions } from './download-actions'
import { FileTree } from './file-tree'
import { OptionsPanel } from './options-panel'
import { TargetSelector } from './target-selector'
import { useExport } from './use-export'
import { WarningsList } from './warnings-list'

/**
 * The export surface — EXPORT_ENGINE.md § Export dialog.
 *
 * It is mounted by the shell only while it is open, and its own code is in the studio chunk on
 * purpose: "visible in the frame the button is pressed" and "behind a dynamic import" cannot both be
 * true, and PERFORMANCE.md § Mandatory dynamic imports names the four modules that have to be split —
 * `codegen`, Prettier, `jszip` and the highlighter — none of which is this file. All four are behind
 * an `import()` in `run-export`, `download-actions` and `code-viewer`.
 */
export function ExportDialog() {
  const open = useStudioStore((state) => state.ui.exportDialogOpen)
  const documentName = useStudioStore((state) => state.document.meta.name)
  const setOpen = useStudioStore((state) => state.setExportDialogOpen)
  const notify = useToast()
  const { options, resolved, snapshot, setOptions } = useExport(open)
  const [chosen, setChosen] = useState<string | null>(null)

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
      <div className="grid min-h-[420px] grid-cols-[212px_1fr] gap-3" data-testid="export-dialog">
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-border border-r pr-3">
          <TargetSelector onChange={(target) => setOptions({ target })} value={resolved.target} />
          <OptionsPanel onChange={setOptions} options={options} resolved={resolved} />
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          {snapshot.error === null ? (
            <WarningsList onSelectNode={selectNode} warnings={snapshot.warnings} />
          ) : (
            <p className="rounded-sm bg-danger-muted px-2 py-1.5 text-2xs text-danger" role="alert">
              {snapshot.error}
            </p>
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
    </Dialog>
  )
}
