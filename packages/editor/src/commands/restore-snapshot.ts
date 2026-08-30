import { type MotionDocument, documentSchema } from '@motion-studio/schema'
import { omit } from '@motion-studio/utils'
import { castDraft } from 'immer'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError } from './guards'

/**
 * Restoring an autosave snapshot — FILE_FORMAT.md § Autosave. A command rather than
 * `replaceDocument` because the document does not change: its content rolls back, and rolling back
 * is exactly what undo is for. ADR-283 has the boundary between the two.
 *
 * Identity does not roll back. `meta.id` is the IndexedDB key autosave writes to, `createdAt` is
 * provenance, and `template` says where the document came from — a snapshot taken before a rename
 * must not carry the document into a different storage slot.
 */
export interface RestoreSnapshotPayload {
  readonly document: MotionDocument
}

export function restoreSnapshot(payload: RestoreSnapshotPayload): Command<RestoreSnapshotPayload> {
  return {
    type: 'restoreSnapshot',
    label: 'Restore version',
    payload,
    apply(draft) {
      const parsed = documentSchema.safeParse(payload.document)

      if (!parsed.success) {
        throw commandError(
          COMMAND_CODES.invalidMeta,
          'That snapshot is not a valid document',
          parsed.error,
        )
      }

      const snapshot = parsed.data
      const identity = {
        id: draft.meta.id,
        createdAt: draft.meta.createdAt,
        ...(draft.meta.template === undefined ? {} : { template: draft.meta.template }),
      }

      // `castDraft` rather than a cast of ours: the snapshot is freshly parsed, so nothing else
      // holds a reference to it, and Immer's own API is what says so.
      draft.version = snapshot.version
      draft.theme = castDraft(snapshot.theme)
      draft.rootId = snapshot.rootId
      draft.nodes = castDraft(snapshot.nodes)
      draft.assets = castDraft(snapshot.assets)
      draft.meta = castDraft({ ...omit(snapshot.meta, ['template']), ...identity })
    },
  }
}
