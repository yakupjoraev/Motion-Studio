'use client'

import { type SelectionMode, commands } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import { type KeyboardEvent, useCallback } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import type { LayerRowView } from './use-flat-layers'

/** SHORTCUTS.md § Layers tree, as a value: one press is one of these, and never two. */
export type TreeKeyAction =
  | { readonly kind: 'focus'; readonly id: NodeId }
  /** Move focus and take the range from the anchor to it — `Shift+↑`/`↓`. */
  | { readonly kind: 'extend'; readonly id: NodeId }
  | { readonly kind: 'fold'; readonly id: NodeId; readonly expanded: boolean }
  | { readonly kind: 'select'; readonly id: NodeId }
  | { readonly kind: 'rename'; readonly id: NodeId }
  | { readonly kind: 'reorder'; readonly id: NodeId; readonly delta: -1 | 1 }
  | { readonly kind: 'visibility'; readonly id: NodeId }
  | { readonly kind: 'lock'; readonly id: NodeId }

export interface TreeKeyState {
  readonly rows: readonly LayerRowView[]
  readonly focusedId: NodeId | null
}

interface KeyPress {
  readonly key: string
  readonly shiftKey: boolean
  /** `Mod` — `Cmd` on Apple platforms, `Ctrl` elsewhere. Both are read, as everywhere else. */
  readonly modKey: boolean
}

/**
 * The map, as a pure function of the press and the list: what the tree does is decided here and
 * carried out by the hook below, which is what makes "every key produces the expected action"
 * something a test can state directly.
 *
 * `←` on a row that is already closed moves to the parent — the behaviour a tree user expects, and
 * the one thing in the map that is not a one-to-one binding.
 */
export function resolveTreeKey(press: KeyPress, state: TreeKeyState): TreeKeyAction | null {
  const at = state.rows.findIndex((row) => row.id === state.focusedId)
  const row = state.rows[at]

  if (row === undefined) {
    return null
  }

  if (press.modKey && press.shiftKey && (press.key === 'H' || press.key === 'h')) {
    return { kind: 'visibility', id: row.id }
  }

  if (press.modKey && press.shiftKey && (press.key === 'L' || press.key === 'l')) {
    return { kind: 'lock', id: row.id }
  }

  if (press.key === 'ArrowDown' || press.key === 'ArrowUp') {
    const step = press.key === 'ArrowDown' ? 1 : -1

    if (press.modKey) {
      return { kind: 'reorder', id: row.id, delta: step }
    }

    const next = state.rows[at + step]

    return next === undefined ? null : { kind: press.shiftKey ? 'extend' : 'focus', id: next.id }
  }

  if (press.key === 'ArrowRight') {
    if (row.hasChildren && !row.expanded) {
      return { kind: 'fold', id: row.id, expanded: true }
    }

    const child = state.rows[at + 1]

    return row.hasChildren && child !== undefined ? { kind: 'focus', id: child.id } : null
  }

  if (press.key === 'ArrowLeft') {
    if (row.hasChildren && row.expanded) {
      return { kind: 'fold', id: row.id, expanded: false }
    }

    return row.parentId === null ? null : { kind: 'focus', id: row.parentId }
  }

  if (press.key === ' ' || press.key === 'Spacebar') {
    return { kind: 'select', id: row.id }
  }

  if (press.key === 'F2') {
    return { kind: 'rename', id: row.id }
  }

  return null
}

export interface TreeKeyboardOptions extends TreeKeyState {
  readonly focus: (id: NodeId) => void
  readonly fold: (id: NodeId, expanded: boolean) => void
  readonly rename: (id: NodeId) => void
  /** The tree's own select, which marks the change as its own so the sync does not scroll it away. */
  readonly select: (ids: readonly NodeId[], mode: SelectionMode) => void
  /** A drag in flight owns the keyboard: dnd-kit is reading the same arrows. */
  readonly dragging: boolean
}

/**
 * ADR-136: `Space` selects, `Enter` belongs to the drag layer, `F2` renames — and `F2` is stopped
 * here so the shell's focus cycle does not also fire on it.
 */
export function useTreeKeyboard({
  rows,
  focusedId,
  focus,
  fold,
  rename,
  select,
  dragging,
}: TreeKeyboardOptions): (event: KeyboardEvent<HTMLElement>) => void {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (dragging) {
        return
      }

      const action = resolveTreeKey(
        { key: event.key, shiftKey: event.shiftKey, modKey: event.metaKey || event.ctrlKey },
        { rows, focusedId },
      )

      if (action === null) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const state = useStudioStore.getState()

      switch (action.kind) {
        case 'focus':
          focus(action.id)

          return
        case 'extend':
          focus(action.id)
          select([action.id], 'range')

          return
        case 'fold':
          fold(action.id, action.expanded)

          return
        case 'select':
          select([action.id], 'toggle')

          return
        case 'rename':
          rename(action.id)

          return
        case 'reorder':
          reorder(action.id, action.delta)

          return
        case 'visibility':
          state.dispatch(
            commands.setVisibility({
              ids: [action.id],
              hidden: !(state.document.nodes[action.id]?.hidden ?? false),
            }),
          )

          return
        case 'lock':
          state.dispatch(
            commands.setLocked({
              ids: [action.id],
              locked: !(state.document.nodes[action.id]?.locked ?? false),
            }),
          )
      }
    },
    [dragging, focus, focusedId, fold, rename, rows, select],
  )
}

/**
 * `Mod+↑`/`↓`. The index `reorderNode` takes is counted with the node already out of the list, so a
 * step down is `position + 1` and a step up is `position - 1` — the same convention a drop line uses.
 */
function reorder(id: NodeId, delta: -1 | 1): void {
  const state = useStudioStore.getState()
  const parentId = state.document.nodes[id]?.parentId

  if (parentId === null || parentId === undefined) {
    return
  }

  const siblings = state.document.nodes[parentId]?.children ?? []
  const from = siblings.indexOf(id)
  const to = from + delta

  if (from === -1 || to < 0 || to > siblings.length - 1) {
    return
  }

  state.dispatch(commands.reorderNode({ nodeId: id, index: to }))
}
