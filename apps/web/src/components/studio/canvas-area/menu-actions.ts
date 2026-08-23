import { blockRegistry } from '@motion-studio/blocks'
import type { CanvasMenuAction } from '@motion-studio/canvas'
import { type EditorState, type EditorStore, commands } from '@motion-studio/editor'
import { blockId } from '@motion-studio/schema'

import { type Notify, copySelection } from '../export/use-copy-selection'

const CONTAINER = blockId('container')

/** The container's own first slot, from the registry: the name is the block's to choose, not ours. */
const containerSlot = (): string => blockRegistry.require(CONTAINER).slots[0]?.name ?? 'children'

/** PRODUCT.md § 3, answered against the store. `undefined` means the item is available. */
export function menuAvailability(state: EditorState, action: CanvasMenuAction): string | undefined {
  const ids = state.selection.ids
  const [first] = ids
  const node = first === undefined ? undefined : state.document.nodes[first]
  const isRoot = ids.includes(state.document.rootId)
  const nothing = ids.length === 0 ? 'Select a block first' : undefined

  switch (action) {
    case 'copy':
      return nothing
    case 'duplicate':
    case 'delete':
    case 'wrap':
      return nothing ?? (isRoot ? 'The page itself cannot be' : undefined)
    case 'paste':
      return state.clipboard.nodes === null ? 'Clipboard is empty' : undefined
    case 'pasteStyle':
      return state.clipboard.style === null ? 'Copy a block’s style first' : (nothing ?? undefined)
    case 'bringForward':
    case 'sendBackward':
      return ids.length === 1 && !isRoot ? undefined : 'Select one block'
    case 'unwrap':
      return node === undefined || node.children.length === 0 || isRoot
        ? `${node?.name ?? 'This block'} has no children`
        : undefined
    case 'resetOverrides':
      return node === undefined || node.responsive[state.viewport.breakpoint] === undefined
        ? 'No overrides at this breakpoint'
        : undefined
    case 'copyReact':
      return nothing
    // Saying so is more use than an item that does nothing when it is clicked.
    default:
      return 'Motion arrives with the motion engine'
  }
}

const siblingsOf = (state: EditorState, id: string): readonly string[] => {
  const parentId = state.document.nodes[id as never]?.parentId

  return parentId === null || parentId === undefined
    ? []
    : (state.document.nodes[parentId]?.children ?? [])
}

/** Every action is a store call, so the canvas menu and the command palette will run one thing. */
export function runMenuAction(
  store: EditorStore,
  action: CanvasMenuAction,
  notify: Notify | null = null,
): void {
  const state = store.getState()
  const ids = state.selection.ids
  const [first] = ids

  switch (action) {
    case 'duplicate':
      state.dispatch(commands.duplicateNodes({ ids }))

      return
    case 'copy':
      void state.copy(ids)

      return
    case 'paste':
      void state.paste()

      return
    case 'pasteStyle':
      state.pasteStyle(ids)

      return
    case 'delete':
      state.dispatch(commands.removeNodes({ ids }))

      return
    case 'bringForward':
    case 'sendBackward': {
      if (first === undefined) {
        return
      }

      const siblings = siblingsOf(state, first)
      const index = siblings.indexOf(first)
      const next = action === 'bringForward' ? index + 1 : index - 1

      if (next >= 0 && next < siblings.length) {
        state.dispatch(commands.reorderNode({ nodeId: first, index: next }))
      }

      return
    }
    case 'wrap':
      state.dispatch(commands.wrapInContainer({ ids, blockId: CONTAINER, slot: containerSlot() }))

      return
    case 'unwrap':
      if (first !== undefined) {
        state.dispatch(commands.unwrap({ nodeId: first }))
      }

      return
    case 'resetOverrides': {
      const node = first === undefined ? undefined : state.document.nodes[first]
      const overrides = node?.responsive[state.viewport.breakpoint]

      if (node === undefined || overrides === undefined) {
        return
      }

      state.dispatchBatch(
        Object.keys(overrides).map((path) =>
          commands.clearResponsiveProp({
            nodeId: node.id,
            breakpoint: state.viewport.breakpoint,
            path,
          }),
        ),
        'Reset overrides',
      )

      return
    }
    case 'copyReact':
      // The dialog's own pipeline, with `scope: 'selection'` — one code path, ADR-246.
      void copySelection(store, notify)

      return
    default:
      // `addMotion` is disabled with a reason; there is nothing to run.
      return
  }
}
