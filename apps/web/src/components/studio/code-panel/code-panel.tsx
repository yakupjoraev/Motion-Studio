'use client'

import type { ExportFile } from '@motion-studio/codegen'

import { useStudio } from '../../../lib/i18n/studio-surface'
import { CodeViewer } from '../export/code-viewer'

import { useSelectedCode } from './use-selected-code'

/**
 * Copying is the panel's one action: it is a view, not an editor — `prompts/68`. No toast, because
 * `CodeViewer` already answers on the button itself for 1.2 s, and two confirmations of one click
 * is one too many (UI_GUIDELINES.md § Timing).
 */
const copyFile = (file: ExportFile): void => {
  void navigator.clipboard.writeText(file.contents)
}

/**
 * The selected block's generated component, beside the canvas.
 *
 * What makes this product not a page builder used to live behind a dialog nobody is told to open
 * (`ROADMAP.md` § The differentiation). The panel is the same printer, the same `scope: 'selection'`
 * and the same viewer as **Copy React** — it only puts the answer where it can be seen while the
 * block is being edited.
 */
export function CodePanel() {
  const { chrome } = useStudio()
  const code = useSelectedCode(true)

  if (code.status === 'empty') {
    return (
      <p className="p-3 text-2xs text-foreground-subtle" data-testid="code-panel-empty">
        {chrome.codePanelEmpty}
      </p>
    )
  }

  if (code.status === 'failed') {
    return (
      <div className="flex flex-col gap-1 p-3" data-testid="code-panel-failed">
        <p className="text-2xs text-danger">{chrome.codePanelFailed}</p>
        <p className="font-mono text-2xs text-foreground-subtle">{code.error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-2" data-testid="code-panel">
      <CodeViewer file={code.file} onCopy={copyFile} ready={code.status === 'ready'} />
    </div>
  )
}
