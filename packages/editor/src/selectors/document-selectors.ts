import {
  type BlockId,
  type MotionDocument,
  type Node,
  type NodeId,
  resolveResponsiveProps,
  walk,
} from '@motion-studio/schema'
import type { ThemeConfig } from '@motion-studio/theme'

import type { EditorState } from '../store/store.types'

import { createVersionedSelector } from './create-versioned-selector'

/** One row of the layers tree — LAYERS is prompt 29; this is what the flattening produces. */
export interface LayerRow {
  readonly id: NodeId
  readonly parentId: NodeId | null
  readonly blockId: BlockId
  readonly name: string
  readonly depth: number
  readonly hidden: boolean
  readonly locked: boolean
  readonly hasChildren: boolean
}

// Reference-stable: they return a value that already exists in the state, so no `useShallow`.
export const selectDocument = (state: EditorState): MotionDocument => state.document
export const selectVersion = (state: EditorState): number => state.version
export const selectDirty = (state: EditorState): boolean => state.dirty
export const selectRootId = (state: EditorState): NodeId => state.document.rootId
export const selectTheme = (state: EditorState): ThemeConfig => state.document.theme

/** Per-node subscription — the canvas pattern in PERFORMANCE.md § Selector discipline. */
export const selectNode =
  (id: NodeId) =>
  (state: EditorState): Node | undefined =>
    state.document.nodes[id]

/** The array lives in the node, so this is stable between mutations of that node. */
export const selectChildren =
  (id: NodeId) =>
  (state: EditorState): readonly NodeId[] =>
    state.document.nodes[id]?.children ?? []

const buildLayerRows = (document: MotionDocument): readonly LayerRow[] => {
  const depths = new Map<NodeId, number>([[document.rootId, 0]])
  const rows: LayerRow[] = []

  for (const node of walk(document)) {
    const depth = depths.get(node.id) ?? 0

    for (const child of node.children) {
      depths.set(child, depth + 1)
    }

    rows.push({
      id: node.id,
      parentId: node.parentId,
      blockId: node.blockId,
      name: node.name,
      depth,
      hidden: node.hidden,
      locked: node.locked,
      hasChildren: node.children.length > 0,
    })
  }

  return rows
}

/** Allocates a new array, so it is memoised: two calls at the same document return one reference. */
export const selectFlatLayers = createVersionedSelector<EditorState, readonly LayerRow[]>(
  (state) => [state.document],
  (state) => buildLayerRows(state.document),
)

/**
 * The node with its responsive overrides folded in for the active breakpoint —
 * RESPONSIVE_ENGINE.md § Resolution. Memoised per call site, which is one node: the canvas creates
 * one of these per rendered node and the inspector one for the selection.
 */
export const selectResolvedNode = (id: NodeId): ((state: EditorState) => Node | undefined) =>
  createVersionedSelector<EditorState, Node | undefined>(
    (state) => [state.document, state.viewport.breakpoint],
    (state) => {
      const node = state.document.nodes[id]

      if (node === undefined) {
        return undefined
      }

      return { ...node, props: resolveResponsiveProps(node, state.viewport.breakpoint) }
    },
  )
