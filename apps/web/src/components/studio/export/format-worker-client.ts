import type { ExportFile, FormatOutcome, IRWarning } from '@motion-studio/codegen'

import type { FormatReply, FormatRequest } from './format.worker'

/**
 * The main thread's half of ADR-253: one worker, one pending reply per file, and a `null` whenever
 * the browser will not give us a worker at all — in which case the caller formats where it always did.
 *
 * There is no timeout and no retry. A worker that never answers is a bug in this repository rather
 * than a network condition, and a silent fallback would hide it; the export simply waits, the same
 * way it waited for Prettier on the main thread.
 */
export interface WorkerFormatter {
  readonly format: (file: ExportFile) => Promise<FormatOutcome>
  readonly warnings: readonly IRWarning[]
  readonly dispose: () => void
}

export async function startFormatWorker(): Promise<WorkerFormatter | null> {
  if (typeof Worker === 'undefined') {
    return null
  }

  let worker: Worker

  try {
    worker = new Worker(new URL('./format.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    return null
  }

  let next = 0
  const pending = new Map<number, (reply: FormatReply) => void>()

  worker.addEventListener('message', (event: MessageEvent<FormatReply>) => {
    const resolve = pending.get(event.data.id)

    pending.delete(event.data.id)
    resolve?.(event.data)
  })

  const ask = (
    request: { kind: 'load' } | { kind: 'file'; file: ExportFile },
  ): Promise<FormatReply> =>
    new Promise((resolve) => {
      const id = next
      next += 1

      pending.set(id, resolve)
      worker.postMessage({ ...request, id } as FormatRequest)
    })

  const loaded = await ask({ kind: 'load' })

  if (loaded.kind !== 'load' || !loaded.ok) {
    worker.terminate()

    return null
  }

  return {
    format: async (file) => {
      const reply = await ask({ kind: 'file', file })

      return reply.kind === 'file'
        ? { files: [reply.file], warnings: reply.warnings }
        : { files: [file], warnings: [] }
    },
    warnings: [],
    dispose: () => worker.terminate(),
  }
}
