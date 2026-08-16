import type { NodeId } from '@motion-studio/schema'

import { type StudioShortcut, type StudioShortcutContext, hasSelection } from './shortcut.types'

const parentOf = ({ store }: StudioShortcutContext): NodeId | null => {
  const state = store.getState()
  const [first] = state.selection.ids

  return first === undefined ? null : (state.document.nodes[first]?.parentId ?? null)
}

const firstChildOf = ({ store }: StudioShortcutContext): NodeId | null => {
  const state = store.getState()
  const [first] = state.selection.ids

  return first === undefined ? null : (state.document.nodes[first]?.children[0] ?? null)
}

/**
 * SHORTCUTS.md § Selection. The pointer rows of that table are the canvas's own gestures and are not
 * key bindings; everything with a key is here.
 */
export const SELECTION_SHORTCUTS: readonly StudioShortcut[] = [
  {
    id: 'select-all',
    keys: 'mod+a',
    label: 'Select all siblings at this level',
    group: 'Selection',
    scope: 'global',
    run: ({ store }) => {
      store.getState().selectAll()
    },
  },
  {
    id: 'deselect-all',
    keys: 'mod+shift+a',
    label: 'Deselect all',
    group: 'Selection',
    scope: 'global',
    run: ({ store }) => {
      store.getState().clearSelection()
    },
  },
  {
    id: 'next-sibling',
    keys: 'tab',
    label: 'Next sibling',
    group: 'Selection',
    scope: 'canvas',
    // The canvas walks siblings from its own keyboard handler (prompt 19), which also has to leave
    // the browser's focus order alone everywhere else.
    delegated: true,
    preventDefault: false,
    run: () => undefined,
  },
  {
    id: 'previous-sibling',
    keys: 'shift+tab',
    label: 'Previous sibling',
    group: 'Selection',
    scope: 'canvas',
    delegated: true,
    preventDefault: false,
    run: () => undefined,
  },
  {
    id: 'enter-container',
    keys: 'enter',
    label: 'Enter container',
    group: 'Selection',
    scope: 'canvas',
    when: hasSelection,
    run: ({ store }) => {
      const [first] = store.getState().selection.ids

      if (first !== undefined) {
        store.getState().enterNode(first)
      }
    },
  },
  {
    id: 'select-parent',
    keys: 'mod+shift+up',
    label: 'Select parent',
    group: 'Selection',
    scope: 'global',
    when: (context) => parentOf(context) !== null,
    run: (context) => {
      const parent = parentOf(context)

      if (parent !== null) {
        context.store.getState().select([parent])
      }
    },
  },
  {
    id: 'select-first-child',
    keys: 'mod+shift+down',
    label: 'Select first child',
    group: 'Selection',
    scope: 'global',
    when: (context) => firstChildOf(context) !== null,
    run: (context) => {
      const child = firstChildOf(context)

      if (child !== null) {
        context.store.getState().select([child])
      }
    },
  },
]
