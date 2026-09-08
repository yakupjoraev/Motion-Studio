'use client'

import { loadBlockDefinition } from '@motion-studio/blocks/lazy'
import type { UnknownProps } from '@motion-studio/schema'
import { useEffect, useState } from 'react'

import type { StageBlock } from './hero/hero-stage'

/**
 * Each block's own `previewProps`, fetched from the category's metadata module.
 *
 * Not `blockRegistry`: that is 44.5 kB gzip of definitions for seventy-two blocks (ADR-292) and this
 * page shows four. The metadata modules are the split ADR-107 already keeps for `codegen`, so
 * reaching for them here costs three requests and no first-load bytes.
 *
 * Nothing is rendered until every one has landed. A page that fills in block by block is three
 * layout shifts on the first screen, which is the one place PERFORMANCE.md § Budgets has no room.
 */
export function useBlockProps(blocks: readonly StageBlock[]): readonly UnknownProps[] | null {
  const [props, setProps] = useState<readonly UnknownProps[] | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all(blocks.map((block) => loadBlockDefinition(block.category, block.id))).then(
      (definitions) => {
        if (!cancelled) {
          setProps(definitions.map((definition) => definition.previewProps as UnknownProps))
        }
      },
      // A cancelled navigation rejects these; the frame keeps its placeholder and says nothing.
      () => undefined,
    )

    return () => {
      cancelled = true
    }
  }, [blocks])

  return props
}
