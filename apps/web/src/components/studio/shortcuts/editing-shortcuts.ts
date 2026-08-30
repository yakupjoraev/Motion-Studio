import type { CanvasMenuAction } from '@motion-studio/canvas'
import { commands } from '@motion-studio/editor'

import { menuAvailability, runMenuAction } from '../canvas-area/menu-actions'

import { tryPasteDocument } from '../documents/document-paste-port'

import { type StudioShortcut, type StudioShortcutContext, hasSelection } from './shortcut.types'

/** The canvas menu and the keyboard run the same function, so the two can never drift apart. */
const menu = (action: CanvasMenuAction) => ({
  when: ({ store }: StudioShortcutContext) =>
    menuAvailability(store.getState(), action) === undefined,
  run: ({ store, notify }: StudioShortcutContext) => {
    runMenuAction(store, action, notify)
  },
})

/** Both flags read the first selected node and write the opposite to every selected one. */
const toggleFlag = ({ store }: StudioShortcutContext, flag: 'hidden' | 'locked'): void => {
  const state = store.getState()
  const ids = state.selection.ids
  const [first] = ids
  const node = first === undefined ? undefined : state.document.nodes[first]

  if (node === undefined) {
    return
  }

  const next = !node[flag]

  state.dispatch(
    flag === 'hidden'
      ? commands.setVisibility({ ids, hidden: next })
      : commands.setLocked({ ids, locked: next }),
  )
}

/** SHORTCUTS.md § Editing, transcribed. */
export const EDITING_SHORTCUTS: readonly StudioShortcut[] = [
  {
    id: 'duplicate',
    keys: 'mod+d',
    label: 'Duplicate',
    group: 'Editing',
    scope: 'global',
    ...menu('duplicate'),
  },
  { id: 'copy', keys: 'mod+c', label: 'Copy', group: 'Editing', scope: 'global', ...menu('copy') },
  {
    id: 'copy-react',
    keys: 'mod+shift+c',
    label: 'Copy React',
    group: 'Editing',
    scope: 'global',
    keywords: ['export', 'component', 'clipboard'],
    ...menu('copyReact'),
  },
  {
    id: 'cut',
    keys: 'mod+x',
    label: 'Cut',
    group: 'Editing',
    scope: 'global',
    when: hasSelection,
    run: ({ store }) => {
      void store.getState().cut(store.getState().selection.ids)
    },
  },
  {
    id: 'paste',
    keys: 'mod+v',
    label: 'Paste',
    group: 'Editing',
    scope: 'global',
    when: menu('paste').when,
    /*
     * A `.motion` document on the system clipboard wins over blocks in the store's — ADR-291. The
     * store's clipboard is a cache of an earlier copy; the system clipboard is what the user copied
     * last, and the last copy is what a paste means.
     */
    run: (context) => {
      void tryPasteDocument().then((handled) => {
        if (!handled) {
          menu('paste').run(context)
        }
      })
    },
  },
  {
    id: 'paste-in-place',
    keys: 'mod+shift+v',
    label: 'Paste in place',
    group: 'Editing',
    scope: 'global',
    when: ({ store }) => store.getState().clipboard.nodes !== null,
    run: ({ store }) => {
      void store.getState().pasteInPlace()
    },
  },
  {
    id: 'paste-style',
    keys: 'mod+alt+v',
    label: 'Paste style only',
    group: 'Editing',
    scope: 'global',
    ...menu('pasteStyle'),
  },
  {
    id: 'delete',
    keys: 'delete',
    label: 'Delete',
    group: 'Editing',
    scope: 'global',
    ...menu('delete'),
  },
  {
    id: 'delete-backspace',
    keys: 'backspace',
    label: 'Delete',
    group: 'Editing',
    scope: 'global',
    ...menu('delete'),
  },
  {
    id: 'wrap-in-container',
    keys: 'mod+g',
    label: 'Wrap in container',
    group: 'Editing',
    scope: 'global',
    ...menu('wrap'),
  },
  {
    id: 'unwrap',
    keys: 'mod+shift+g',
    label: 'Unwrap',
    group: 'Editing',
    scope: 'global',
    ...menu('unwrap'),
  },
  {
    id: 'rename',
    keys: 'f2',
    label: 'Rename',
    group: 'Editing',
    scope: 'canvas',
    when: hasSelection,
    run: ({ store }) => {
      const [first] = store.getState().selection.ids

      if (first !== undefined) {
        store.getState().setEditing(first)
      }
    },
  },
  {
    id: 'toggle-visibility',
    keys: 'mod+shift+h',
    label: 'Toggle visibility',
    group: 'Editing',
    scope: 'global',
    when: hasSelection,
    run: (context) => {
      toggleFlag(context, 'hidden')
    },
  },
  {
    id: 'toggle-lock',
    keys: 'mod+shift+l',
    label: 'Toggle lock',
    group: 'Editing',
    scope: 'global',
    when: hasSelection,
    run: (context) => {
      toggleFlag(context, 'locked')
    },
  },
  {
    id: 'bring-forward',
    keys: 'mod+]',
    label: 'Bring forward',
    group: 'Editing',
    scope: 'global',
    ...menu('bringForward'),
  },
  {
    id: 'send-backward',
    keys: 'mod+[',
    label: 'Send backward',
    group: 'Editing',
    scope: 'global',
    ...menu('sendBackward'),
  },
  {
    id: 'bring-to-front',
    keys: 'mod+alt+]',
    label: 'Bring to front',
    group: 'Editing',
    scope: 'global',
    when: ({ store }) => menuAvailability(store.getState(), 'bringForward') === undefined,
    run: ({ store }) => {
      const state = store.getState()
      const [id] = state.selection.ids
      const parentId = id === undefined ? null : (state.document.nodes[id]?.parentId ?? null)
      const siblings = parentId === null ? [] : (state.document.nodes[parentId]?.children ?? [])

      if (id !== undefined) {
        state.dispatch(commands.reorderNode({ nodeId: id, index: siblings.length - 1 }))
      }
    },
  },
  {
    id: 'send-to-back',
    keys: 'mod+alt+[',
    label: 'Send to back',
    group: 'Editing',
    scope: 'global',
    when: ({ store }) => menuAvailability(store.getState(), 'sendBackward') === undefined,
    run: ({ store }) => {
      const state = store.getState()
      const [id] = state.selection.ids

      if (id !== undefined) {
        state.dispatch(commands.reorderNode({ nodeId: id, index: 0 }))
      }
    },
  },
]
