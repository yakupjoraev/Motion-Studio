'use client'

import { selectors } from '@motion-studio/editor'
import type { BlockId, NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import { deferredBlockRegistry } from '../../../../store/block-registry'
import { useStudioStore } from '../../../../store/editor-store'

/** A row as the tree renders it: the document's own fields plus everything ARIA asks a treeitem for. */
export interface LayerRowView {
  readonly id: NodeId
  readonly parentId: NodeId | null
  readonly blockId: BlockId
  readonly name: string
  readonly depth: number
  readonly hidden: boolean
  readonly locked: boolean
  readonly hasChildren: boolean
  readonly expanded: boolean
  /** Siblings in the whole document, not in the rendered window — ACCESSIBILITY.md § Layers tree. */
  readonly setSize: number
  readonly posInSet: number
}

export interface FlattenLayersArgs {
  /** Document order, every node, from the store's versioned selector. */
  readonly rows: readonly selectors.LayerRow[]
  /** ADR-132: the ids the user folded. Absent means open. */
  readonly collapsed: ReadonlySet<NodeId>
  readonly query: string
  readonly blockName: (id: BlockId) => string
}

export interface FlatLayers {
  readonly rows: readonly LayerRowView[]
  /** Rows that matched the query themselves — the number the live region announces. */
  readonly matchCount: number
  readonly searching: boolean
}

/**
 * The flattening the virtualizer counts rows against. A collapsed subtree is not in the list at all,
 * so folding a group is also what makes it cost nothing, and a query narrows the list to the matches
 * plus the ancestors that lead to them — a match inside a folded group has to be reachable.
 */
export function flattenLayers({
  rows,
  collapsed,
  query,
  blockName,
}: FlattenLayersArgs): FlatLayers {
  const term = query.trim().toLowerCase()
  const found = term === '' ? null : search(rows, term, blockName)
  const shown = (row: selectors.LayerRow): boolean => found === null || found.path.has(row.id)

  const siblings = new Map<NodeId | null, number>()
  const position = new Map<NodeId, number>()

  for (const row of rows) {
    if (!shown(row)) {
      continue
    }

    const next = (siblings.get(row.parentId) ?? 0) + 1

    siblings.set(row.parentId, next)
    position.set(row.id, next)
  }

  const listed: LayerRowView[] = []
  // The depth of the folded ancestor whose subtree is being skipped. Document order is pre-order, so
  // a subtree is the run of rows deeper than the row that opened it.
  let folded: number | null = null

  for (const row of rows) {
    if (folded !== null) {
      if (row.depth > folded) {
        continue
      }

      folded = null
    }

    if (!shown(row)) {
      continue
    }

    const children = siblings.get(row.id) ?? 0
    // A query decides openness by itself: the paths it shows are open and nothing else is, which is
    // what leaves the user's own folds untouched when the query is cleared (ADR-132).
    const expanded = found === null ? row.hasChildren && !collapsed.has(row.id) : children > 0

    if (row.hasChildren && !expanded) {
      folded = row.depth
    }

    listed.push({
      ...row,
      expanded,
      setSize: siblings.get(row.parentId) ?? 1,
      posInSet: position.get(row.id) ?? 1,
    })
  }

  return { rows: listed, matchCount: found?.matched.size ?? 0, searching: found !== null }
}

interface SearchResult {
  readonly matched: ReadonlySet<NodeId>
  /** The matches and every ancestor above them. */
  readonly path: ReadonlySet<NodeId>
}

function search(
  rows: readonly selectors.LayerRow[],
  term: string,
  blockName: (id: BlockId) => string,
): SearchResult {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const matched = new Set<NodeId>()
  const path = new Set<NodeId>()

  for (const row of rows) {
    const hit =
      row.name.toLowerCase().includes(term) || blockName(row.blockId).toLowerCase().includes(term)

    if (!hit) {
      continue
    }

    matched.add(row.id)

    let current: selectors.LayerRow | undefined = row

    while (current !== undefined && !path.has(current.id)) {
      path.add(current.id)
      current = current.parentId === null ? undefined : byId.get(current.parentId)
    }
  }

  return { matched, path }
}

/** The name the block is listed under, so a search for "Section" finds nodes nobody renamed. */
const registryName = (id: BlockId): string => deferredBlockRegistry.get(id)?.name ?? id

/**
 * One flattening per document version, per fold and per query — never per render. `selectFlatLayers`
 * is memoised on the document, so an edit that touches one node's props does not rebuild the list.
 */
export function useFlatLayers(collapsed: ReadonlySet<NodeId>, query: string): FlatLayers {
  const rows = useStudioStore(selectors.selectFlatLayers)

  return useMemo(
    () => flattenLayers({ rows, collapsed, query, blockName: registryName }),
    [collapsed, query, rows],
  )
}
