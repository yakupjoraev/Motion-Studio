'use client'

import type { CodegenIR, ExportFile, IRWarning } from '@motion-studio/codegen'
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
  resolveOptions,
} from '@motion-studio/codegen/options'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'

/**
 * What the dialog renders from. `formatted` is the half of it that makes streaming visible: a file is
 * in the list from the moment it is printed, and in `formatted` only once Prettier has been over it,
 * which is what the per-file skeletons key off.
 */
export interface ExportSnapshot {
  readonly status: 'generating' | 'streaming' | 'ready' | 'failed'
  readonly files: readonly ExportFile[]
  readonly formatted: readonly string[]
  readonly warnings: readonly IRWarning[]
  readonly dependencies: Readonly<Record<string, string>>
  readonly error: string | null
  /** Wall clock for the whole run, so a regeneration can be reported as a number rather than a feeling. */
  readonly elapsedMs: number | null
}

export interface UseExportResult {
  /** What the user chose. */
  readonly options: ExportOptions
  /** What the export will actually do — `resolveOptions`, so a control a target fixes reads as fixed. */
  readonly resolved: ExportOptions
  readonly snapshot: ExportSnapshot
  setOptions(patch: Partial<ExportOptions>): void
}

const PENDING: ExportSnapshot = {
  status: 'generating',
  files: [],
  formatted: [],
  warnings: [],
  dependencies: {},
  error: null,
  elapsedMs: null,
}

/**
 * The options the IR is built from, and the options the printed files depend on. `includeTheme` and
 * `format` are absent from the first list because neither reaches `buildIR` — which is the whole point
 * of caching the two separately, and why toggling the theme checkbox reprints without rebuilding.
 */
const IR_KEYS = [
  'target',
  'language',
  'singleFile',
  'includeMotion',
  'extractProps',
  'assets',
  'imageComponent',
  'scope',
] as const satisfies readonly (keyof ExportOptions)[]

const PRINT_KEYS = [...IR_KEYS, 'includeTheme', 'format'] as const

/** Enough for a session of toggling; a document edit invalidates every entry through `version`. */
const CACHE_LIMIT = 8

const irCache = new Map<string, CodegenIR>()
const runCache = new Map<string, ExportSnapshot>()

const remember = <T>(cache: Map<string, T>, key: string, value: T): void => {
  cache.set(key, value)

  for (const stale of [...cache.keys()].slice(0, Math.max(0, cache.size - CACHE_LIMIT))) {
    cache.delete(stale)
  }
}

const keyOf = (
  keys: readonly (keyof ExportOptions)[],
  options: ExportOptions,
  version: number,
): string => [version, ...keys.map((key) => String(options[key]))].join('|')

/**
 * Generation is started by an effect and every state write goes through `startTransition` — ADR-244:
 * the measured 48 ms is a task nothing is painting during, and the transition is what keeps that true
 * for the shell behind the dialog.
 */
export function useExport(open: boolean): UseExportResult {
  const document = useStudioStore((state) => state.document)
  const version = useStudioStore((state) => state.version)
  const [options, setOptionsState] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS)
  const [snapshot, setSnapshot] = useState<ExportSnapshot>(PENDING)
  const resolved = useMemo(() => resolveOptions(options), [options])

  const setOptions = useCallback((patch: Partial<ExportOptions>): void => {
    setOptionsState((current) => ({ ...current, ...patch }))
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const printKey = keyOf(PRINT_KEYS, resolved, version)
    const finished = runCache.get(printKey)

    if (finished !== undefined) {
      setSnapshot(finished)

      return
    }

    let cancelled = false
    const started = performance.now()
    /**
     * Held outside the run so a failure can still report what the IR had already flagged —
     * `prompts/58` § The five boundaries asks the export's error state to carry the warning list,
     * and a formatter that throws on the fourth file must not take the first three's warnings with it.
     */
    let current: ExportSnapshot | null = null

    setSnapshot(PENDING)

    void (async () => {
      try {
        // The pipeline, Prettier and the theme printers are all behind this one import.
        const engine = await import('./run-export')

        if (cancelled) {
          return
        }

        const request = { document, options: resolved }
        const irKey = keyOf(IR_KEYS, resolved, version)
        let ir = irCache.get(irKey) ?? null

        if (ir === null) {
          ir = engine.buildExportIR(request)

          if (ir !== null) {
            remember(irCache, irKey, ir)
          }
        }

        const printed = engine.printExport(request, ir)

        if (cancelled) {
          return
        }

        const paths = printed.files.map((file) => file.path)

        current = {
          status: resolved.format ? 'streaming' : 'ready',
          files: printed.files,
          formatted: resolved.format ? [] : paths,
          warnings: printed.warnings,
          dependencies: printed.dependencies,
          error: null,
          elapsedMs: resolved.format ? null : performance.now() - started,
        }

        const publish = (next: ExportSnapshot): void => {
          current = next
          startTransition(() => setSnapshot(next))
        }

        publish(current)

        if (!resolved.format) {
          remember(runCache, printKey, current)

          return
        }

        const formatting = await engine.loadFormatting()

        if (cancelled) {
          return
        }

        if (formatting.format === undefined) {
          publish({
            ...current,
            status: 'ready',
            formatted: paths,
            warnings: [...current.warnings, ...formatting.warnings],
            elapsedMs: performance.now() - started,
          })
          remember(runCache, printKey, current)

          return
        }

        for (const file of printed.files) {
          const outcome = await formatting.format(file)

          if (cancelled) {
            return
          }

          const [next = file] = outcome.files

          publish({
            ...current,
            files: current.files.map((one) => (one.path === file.path ? next : one)),
            formatted: [...current.formatted, file.path],
            warnings: [...current.warnings, ...outcome.warnings],
          })
        }

        publish({ ...current, status: 'ready', elapsedMs: performance.now() - started })
        remember(runCache, printKey, current)
      } catch (error) {
        if (cancelled) {
          return
        }

        setSnapshot({
          ...PENDING,
          status: 'failed',
          // No files: a run that threw wrote nothing, and offering half a project is worse than
          // offering none. The warnings are kept because they are the closest thing to a cause.
          warnings: current?.warnings ?? [],
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [document, open, resolved, version])

  return { options, resolved, snapshot, setOptions }
}
