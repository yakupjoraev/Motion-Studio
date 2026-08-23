/// <reference lib="webworker" />
import { type ExportFile, type IRWarning, formatFiles } from '@motion-studio/codegen'

/**
 * Prettier, off the main thread — ADR-253.
 *
 * The whole of the export's cost is this step: on the sixty-node fixture `buildIR` and the printers
 * are 14 ms together and formatting is 99, which is what took the pipeline past the 100 ms threshold
 * ADR-244 set. Nothing else moves: the IR needs the block registry, the preset catalogue and the
 * producers, none of which survive a structured clone, and none of which is where the time goes.
 *
 * The protocol is two messages. `load` answers whether Prettier arrived, so the dialog can say so
 * once rather than per file; `file` answers with the formatted contents and whatever warning that one
 * file produced. A worker that fails to start at all is answered by the caller, which formats on the
 * main thread exactly as it did before.
 */
export type FormatRequest =
  | { readonly kind: 'load'; readonly id: number }
  | { readonly kind: 'file'; readonly id: number; readonly file: ExportFile }

export type FormatReply =
  | { readonly kind: 'load'; readonly id: number; readonly ok: boolean }
  | {
      readonly kind: 'file'
      readonly id: number
      readonly file: ExportFile
      readonly warnings: readonly IRWarning[]
    }

const scope = self as unknown as DedicatedWorkerGlobalScope

scope.addEventListener('message', (event: MessageEvent<FormatRequest>) => {
  const request = event.data

  if (request.kind === 'load') {
    // Asking with no files loads Prettier and reports whether it arrived, without formatting anything.
    void formatFiles([]).then((outcome) => {
      scope.postMessage({ kind: 'load', id: request.id, ok: outcome.warnings.length === 0 })
    })

    return
  }

  void formatFiles([request.file]).then((outcome) => {
    scope.postMessage({
      kind: 'file',
      id: request.id,
      file: outcome.files[0] ?? request.file,
      warnings: outcome.warnings,
    })
  })
})
