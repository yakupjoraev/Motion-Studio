'use client'

import type { ExportFile } from '@motion-studio/codegen'
import { DEFAULT_EXPORT_OPTIONS } from '@motion-studio/codegen/options'
import { startTransition, useEffect, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'

export interface SelectedCode {
  readonly status: 'empty' | 'generating' | 'ready' | 'failed'
  readonly file: ExportFile | null
  readonly error: string | null
}

const EMPTY: SelectedCode = { status: 'empty', file: null, error: null }

/**
 * A prop edit dispatches a command per step, so `version` moves on every frame of a slider drag. The
 * panel coalesces on that rather than printing per frame: below this the studio would run the printer
 * and Prettier while the pointer is still moving, which is the stall `prompts/68` forbids.
 *
 * 250 ms is a pause, not a delay — it is longer than the gap between two drag frames (~16 ms) and
 * shorter than the gap between a click and reading the result.
 */
export const COALESCE_MS = 250

/** Enough for a session of clicking between blocks; a document edit invalidates every entry. */
const CACHE_LIMIT = 8

const cache = new Map<string, ExportFile>()

const remember = (key: string, file: ExportFile): void => {
  cache.set(key, file)

  for (const stale of [...cache.keys()].slice(0, Math.max(0, cache.size - CACHE_LIMIT))) {
    cache.delete(stale)
  }
}

/**
 * The selected subtree, printed by the same pipeline **Copy React** uses — `scope: 'selection'`,
 * ADR-246. One code path, so the panel cannot drift from what the copy button hands over.
 *
 * Nothing selected is `empty` rather than the document root: the root is the whole page, the whole
 * page is what the export dialog answers, and printing it here would make the panel a second, worse
 * copy of that dialog — ADR-401.
 */
export function useSelectedCode(open: boolean): SelectedCode {
  const document = useStudioStore((state) => state.document)
  const version = useStudioStore((state) => state.version)
  const selected = useStudioStore((state) => state.selection.ids[0] ?? null)
  const [code, setCode] = useState<SelectedCode>(EMPTY)

  useEffect(() => {
    if (!open || selected === null) {
      setCode(EMPTY)

      return
    }

    const key = `${version}|${selected}`
    const cached = cache.get(key)

    if (cached !== undefined) {
      setCode({ status: 'ready', file: cached, error: null })

      return
    }

    let cancelled = false

    // Only the first print of a selection shows the skeleton. Re-entering `generating` on every
    // keystroke would replace readable code with a shape, which reads as flicker rather than as work.
    setCode((current) =>
      current.file === null ? { status: 'generating', file: null, error: null } : current,
    )

    const timer = setTimeout(() => {
      void (async () => {
        try {
          // The printers and Prettier are all behind this import — they must not reach first load.
          const engine = await import('../export/run-export')

          if (cancelled) {
            return
          }

          const file = await engine.copyEntry({
            document,
            options: { ...DEFAULT_EXPORT_OPTIONS, scope: 'selection' },
            selection: selected,
          })

          if (cancelled) {
            return
          }

          remember(key, file)
          startTransition(() => setCode({ status: 'ready', file, error: null }))
        } catch (error) {
          if (cancelled) {
            return
          }

          setCode({
            status: 'failed',
            file: null,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })()
    }, COALESCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [document, open, selected, version])

  return code
}
