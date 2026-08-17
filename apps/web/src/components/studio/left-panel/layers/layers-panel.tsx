'use client'

import { type NodeId, descendants } from '@motion-studio/schema'
import { EmptyState } from '@motion-studio/ui'
import { useCallback, useState } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import { LayersSearch } from './layers-search'
import { LayersTree } from './layers-tree'
import { useFlatLayers } from './use-flat-layers'

/**
 * PRODUCT.md § 2, Layers. The panel owns the two pieces of state that are not the document's — which
 * rows are folded (ADR-132) and what is being searched for — and hands the tree a flat list.
 *
 * The drag layer is no longer mounted here: with the palette a second drag surface and the canvas a
 * drop target, one context has to span both, so it moved to the shell — ADR-179 supersedes ADR-137.
 */
export function LayersPanel() {
  const [collapsed, setCollapsed] = useState<ReadonlySet<NodeId>>(() => new Set<NodeId>())
  const [query, setQuery] = useState('')
  const { rows, matchCount, searching } = useFlatLayers(collapsed, query)
  const total = useStudioStore((state) => Object.keys(state.document.nodes).length)

  const onFold = useCallback((id: NodeId, expanded: boolean, subtree: boolean): void => {
    setCollapsed((current) => {
      const next = new Set(current)
      // `Alt` on a disclosure means the whole subtree, so a group of thirty rows is one gesture.
      const ids = subtree
        ? [id, ...descendants(useStudioStore.getState().document, id).map((node) => node.id)]
        : [id]

      for (const each of ids) {
        if (expanded) {
          next.delete(each)
        } else {
          next.add(each)
        }
      }

      return next
    })
  }, [])

  return (
    <div className="flex h-full flex-col">
      <LayersSearch
        matchCount={matchCount}
        onChange={setQuery}
        searching={searching}
        value={query}
      />

      <div className="min-h-0 flex-1">
        {rows.length === 0 ? (
          <EmptyState className="h-full" message="No layers match." />
        ) : (
          <LayersTree onFold={onFold} rows={rows} />
        )}
      </div>

      <footer className="flex h-[28px] shrink-0 items-center border-border border-t px-2 text-[11px] text-foreground-muted">
        {total} {total === 1 ? 'layer' : 'layers'}
      </footer>
    </div>
  )
}
