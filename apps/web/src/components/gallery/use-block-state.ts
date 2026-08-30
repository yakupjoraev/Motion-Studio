'use client'

import { loadBlockDefinition } from '@motion-studio/blocks/lazy'
import type { BlockCategory, BlockDefinition, BlockId, UnknownProps } from '@motion-studio/schema'
import { useCallback, useEffect, useRef, useState } from 'react'

import { readParams, writeParams } from './url-props'

export interface BlockState {
  /** Parsed and complete. Never partial, so the preview and the source read the same object. */
  readonly props: UnknownProps
  /** Absent until the block's own metadata has loaded. The controls wait for it; the preview does not. */
  readonly definition: BlockDefinition | undefined
  /** Paths the query string carried that the schema rejected — shown once, quietly. */
  readonly rejected: readonly string[]
  /** Per frame during a gesture: state moves, the URL does not. */
  readonly change: (path: string, value: unknown) => void
  /** On release: the URL catches up, with `replaceState`. */
  readonly commit: () => void
  readonly reset: () => void
  readonly modified: boolean
}

/**
 * The props a visitor is looking at, and the URL that describes them.
 *
 * Two rules, both from `prompts/52` § URL-synced state, and the reason each one is a rule:
 *
 *   - **A URL is untrusted input**, so nothing reaches the block that the block's own schema has not
 *     parsed. Not the control metadata, not a coercion table written here — the schema, loaded for
 *     this one block. A table beside the schema is a second opinion, and the day they disagree is the
 *     day a query string renders something the studio could not.
 *   - **`replaceState` while scrubbing.** A slider dragged across its range is one intent, and a
 *     history entry per frame turns the back button into a rewind of that drag.
 *
 * The first render has no definition, so it renders the defaults the server already sent. That is
 * also what a visitor with a broken query string gets, which is the quiet degradation the prompt asks
 * for rather than a crash.
 */
export function useBlockState(
  id: BlockId,
  category: BlockCategory,
  defaults: UnknownProps,
): BlockState {
  const [definition, setDefinition] = useState<BlockDefinition | undefined>(undefined)
  const [props, setProps] = useState<UnknownProps>(defaults)
  const [rejected, setRejected] = useState<readonly string[]>([])
  const [modified, setModified] = useState(false)
  const pending = useRef<UnknownProps>(defaults)

  useEffect(() => {
    let cancelled = false

    loadBlockDefinition(category, id).then((loaded) => {
      if (cancelled) {
        return
      }

      const fromUrl = readParams(loaded, new URLSearchParams(window.location.search))

      setDefinition(loaded)
      setProps(fromUrl.props)
      setRejected(fromUrl.rejected)
      setModified(fromUrl.modified)
      pending.current = fromUrl.props
    })

    return () => {
      cancelled = true
    }
  }, [category, id])

  const change = useCallback(
    (path: string, value: unknown) => {
      const next = { ...pending.current, [path]: value }
      const parsed = definition?.propsSchema.safeParse(next)

      // A control cannot produce a value its own schema rejects; if it does, the old one stands.
      if (parsed !== undefined && !parsed.success) {
        return
      }

      pending.current = (parsed?.data as UnknownProps | undefined) ?? next
      setProps(pending.current)
      setModified(true)
    },
    [definition],
  )

  const commit = useCallback(() => {
    if (definition === undefined) {
      return
    }

    writeParams(definition, pending.current)
  }, [definition])

  const reset = useCallback(() => {
    pending.current = defaults
    setProps(defaults)
    setModified(false)
    setRejected([])

    if (definition !== undefined) {
      writeParams(definition, defaults)
    }
  }, [defaults, definition])

  return { props, definition, rejected, change, commit, reset, modified }
}
