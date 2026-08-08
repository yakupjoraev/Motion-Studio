import { ASSET_ID_RE, type MotionDocument, type NodeId, descendants } from '@motion-studio/schema'
import type { Draft } from 'immer'

import type { Command } from './command.types'
import { detachFromParent, requireNode, requireNotRoot } from './guards'

export interface RemoveNodesPayload {
  readonly ids: readonly NodeId[]
}

/** Asset ids are branded strings with a pattern, so a reference is recognisable wherever it sits. */
function collectAssetIds(value: unknown, found: Set<string>): void {
  if (typeof value === 'string') {
    if (ASSET_ID_RE.test(value)) {
      found.add(value)
    }

    return
  }

  if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value)) {
      collectAssetIds(item, found)
    }
  }
}

const nodeAssetIds = (draft: Draft<MotionDocument>, ids: Iterable<NodeId>): Set<string> => {
  const found = new Set<string>()

  for (const id of ids) {
    const node = draft.nodes[id]

    if (node !== undefined) {
      collectAssetIds(node.props, found)
      collectAssetIds(node.responsive, found)
      collectAssetIds(node.effects, found)
    }
  }

  return found
}

/**
 * EDITOR_ENGINE.md § removeNodes. Subtrees are collected **before** anything is deleted — deleting as
 * you walk loses the children of the node you just removed, which is how orphans get into a document.
 */
export function removeNodes(payload: RemoveNodesPayload): Command<RemoveNodesPayload> {
  const count = payload.ids.length

  return {
    type: 'removeNodes',
    label: count === 1 ? 'Delete block' : `Delete ${count} blocks`,
    payload,
    apply(draft) {
      const doomed = new Set<NodeId>()

      for (const id of payload.ids) {
        requireNode(draft, id)
        requireNotRoot(draft, id)
        doomed.add(id)

        for (const node of descendants(draft, id)) {
          doomed.add(node.id)
        }
      }

      const released = nodeAssetIds(draft, doomed)

      for (const id of doomed) {
        detachFromParent(draft, id)
        delete draft.nodes[id]
      }

      // Only what the removed nodes referenced: an asset uploaded and not yet placed is not garbage.
      const surviving = nodeAssetIds(
        draft,
        Object.values(draft.nodes).map((node) => node.id),
      )

      for (const asset of Object.values(draft.assets)) {
        if (released.has(asset.id) && !surviving.has(asset.id)) {
          delete draft.assets[asset.id]
        }
      }
    },
  }
}
