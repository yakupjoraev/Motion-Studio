'use client'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** `1` keeps the counters in a production build. Declared in `next.config.ts` (ADR-315). */
      readonly MS_INSTRUMENT: string
    }
  }

  interface Window {
    /** Renders per instrumented subtree, keyed by the id the subtree was registered under. */
    __renderCounts?: Record<string, number>
  }
}

/**
 * Counts renders for the exact-zero budgets in PERFORMANCE.md § Measurement. Both operands of the
 * guard are build-time constants, so an ordinary production build keeps only the early return
 * (ADR-315).
 */
export function countRender(id: string): void {
  if (process.env.NODE_ENV === 'production' && process.env.MS_INSTRUMENT !== '1') {
    return
  }

  if (typeof window === 'undefined') {
    return
  }

  window.__renderCounts ??= {}
  window.__renderCounts[id] = (window.__renderCounts[id] ?? 0) + 1
}

/** The same count for a subtree that has no natural call site of its own. Renders nothing. */
export function RenderCounter({ id }: { readonly id: string }): null {
  countRender(id)

  return null
}
