import type { NodeId } from '@motion-studio/schema'
import type { Result } from '@motion-studio/utils'
import { MotionStudioError, err, ok } from '@motion-studio/utils'

import {
  CLIPBOARD_CODES,
  type PasteReport,
  type PasteTarget,
  type SerializedSubtree,
  clipboardError,
} from '../../clipboard/clipboard.types'
import { deserializeSubtree } from '../../clipboard/deserialize-subtree'
import { resolvePasteTarget } from '../../clipboard/paste-target'
import { serializeSubtree } from '../../clipboard/serialize-subtree'
import { applicableStyleProps, collectStyleProps } from '../../clipboard/style-props'
import {
  decodeClipboardText,
  encodeClipboardText,
  readSystemClipboard,
  writeSystemClipboard,
} from '../../clipboard/system-clipboard'
import { pasteNodes } from '../../commands/paste-nodes'
import { removeNodes } from '../../commands/remove-nodes'
import { setProp } from '../../commands/set-prop'
import type { ClipboardSlice } from '../store.types'

import type { ResolvedOptions, SliceCreator } from './slice.types'

const describe = (pasted: number, requested: number, rejected: PasteReport['rejected']): string => {
  if (rejected.length === 0) {
    return `Pasted ${pasted} ${pasted === 1 ? 'block' : 'blocks'}.`
  }

  const names = rejected.map((entry) => `\`${entry.blockId}\``).join(', ')
  const dropped = requested - pasted

  return `Pasted ${pasted} of ${requested} blocks. ${dropped} ${
    dropped === 1 ? 'block is' : 'blocks are'
  } not available (${names}).`
}

export const createClipboardSlice =
  ({ context }: ResolvedOptions): SliceCreator<ClipboardSlice> =>
  (set, get) => {
    /** The payload for this paste: the system clipboard when it holds ours, the store otherwise. */
    const readPayload = async (): Promise<string | SerializedSubtree | null> => {
      const text = await readSystemClipboard()
      const json = text === null ? null : decodeClipboardText(text)

      return json ?? get().clipboard.nodes
    }

    const write = async (ids: readonly NodeId[]): Promise<SerializedSubtree | null> => {
      const { document } = get()
      const subtree = serializeSubtree(document, ids)

      if (subtree.rootIds.length === 0) {
        return null
      }

      set({ clipboard: { ...get().clipboard, nodes: subtree } }, false, 'copy')

      await writeSystemClipboard(encodeClipboardText(subtree))

      return subtree
    }

    const runPaste = async (
      inPlace: boolean,
      target?: PasteTarget,
    ): Promise<Result<PasteReport, MotionStudioError>> => {
      const payload = await readPayload()

      if (payload === null) {
        return err(clipboardError(CLIPBOARD_CODES.empty, 'The clipboard is empty'))
      }

      const state = get()
      const read = deserializeSubtree(payload, {
        registry: context.registry,
        generateId: context.generateId,
        document: state.document,
      })

      if (!read.ok) {
        return read
      }

      const { subtree, requested, rejected, removed } = read.value
      const resolved =
        target ??
        resolvePasteTarget({
          document: state.document,
          registry: context.registry,
          subtree,
          selectionIds: state.selection.ids,
          isolationId: state.selection.isolationId,
          inPlace,
        })

      if ('rejected' in resolved) {
        return err(clipboardError(CLIPBOARD_CODES.targetRejected, resolved.rejected))
      }

      try {
        get().dispatch(
          pasteNodes({
            subtree,
            parentId: resolved.parentId,
            slot: resolved.slot,
            index: resolved.index,
          }),
        )
      } catch (error) {
        // A guard rejecting the target is this function's failure to report. Anything else is a
        // defect in this package, and swallowing it into a `Result` would hide it.
        if (!(error instanceof MotionStudioError)) {
          throw error
        }

        return err(error)
      }

      get().select(subtree.rootIds)

      const pasted = Object.keys(subtree.nodes).length

      return ok({
        pasted,
        requested,
        rejected,
        removed,
        ids: subtree.rootIds,
        message: describe(pasted, requested, rejected),
      })
    }

    return {
      clipboard: { nodes: null, style: null },

      async copy(ids) {
        await write(ids)
      },

      /** Copy writes nothing to the document, so the delete is the whole of the undo step. */
      async cut(ids) {
        const subtree = await write(ids)

        if (subtree !== null) {
          get().dispatch(removeNodes({ ids: subtree.rootIds }))
        }
      },

      paste(target) {
        return runPaste(false, target)
      },

      pasteInPlace() {
        return runPaste(true)
      },

      copyStyle(id) {
        const node = get().document.nodes[id]
        const definition = node === undefined ? undefined : context.registry.get(node.blockId)

        if (node === undefined || definition === undefined) {
          return
        }

        set(
          {
            clipboard: {
              ...get().clipboard,
              style: { blockId: node.blockId, props: collectStyleProps(definition, node) },
            },
          },
          false,
          'copyStyle',
        )
      },

      /** One entry for the whole multi-select — EDITOR_ENGINE.md § Transactions. */
      pasteStyle(ids) {
        const style = get().clipboard.style

        if (style === null) {
          return
        }

        const { document } = get()
        const commands = ids.flatMap((id) => {
          const node = document.nodes[id]
          const definition = node === undefined ? undefined : context.registry.get(node.blockId)

          if (node === undefined || definition === undefined) {
            return []
          }

          return Object.entries(applicableStyleProps(definition, node.props, style.props)).map(
            ([path, value]) => setProp({ nodeId: id, path, value }),
          )
        })

        if (commands.length > 0) {
          get().dispatchBatch(commands, 'Paste style')
        }
      },
    }
  }
