'use client'

import type { BlockId, UnknownProps } from '@motion-studio/schema'
import { useEffect, useState } from 'react'

import type { PrintedSource } from './block-source'

export interface SourceState {
  readonly source: PrintedSource
  /** The exporter would not load. The page keeps working and says which code it is showing. */
  readonly failed: boolean
}

/**
 * The printed component, and the exporter that prints it — loaded only if the visitor changes
 * something.
 *
 * The default props are printed at build time and arrive as HTML, so the flow `prompts/52` times with
 * a stopwatch — land, read the code, copy — costs no exporter at all. `packages/codegen` and the
 * block registry arrive on the first commit of a control, which is the first moment the server's
 * answer stops being true.
 */
export function useSource(
  id: BlockId,
  props: UnknownProps,
  initial: PrintedSource,
  modified: boolean,
): SourceState {
  const [source, setSource] = useState(initial)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!modified) {
      setSource(initial)

      return
    }

    let cancelled = false

    import('./block-source')
      .then(({ printBlockSource }) => {
        if (!cancelled) {
          setSource(printBlockSource(id, props))
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, initial, modified, props])

  return { source, failed }
}
