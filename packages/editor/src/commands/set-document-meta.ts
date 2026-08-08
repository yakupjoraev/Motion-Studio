import { documentMetaSchema } from '@motion-studio/schema'
import { humanize, setPath } from '@motion-studio/utils'
import { current } from 'immer'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError } from './guards'

/** ADR-063. The id, the timestamps and the generator are provenance, not settings. */
export const EDITABLE_META_PATHS: readonly string[] = [
  'name',
  'canvas.width',
  'canvas.background',
  'template',
]

export interface SetDocumentMetaPayload {
  readonly path: string
  readonly value: unknown
}

export function setDocumentMeta(payload: SetDocumentMetaPayload): Command<SetDocumentMetaPayload> {
  return {
    type: 'setDocumentMeta',
    label: `Set ${humanize(payload.path)}`,
    payload,
    coalesceKey: `meta:${payload.path}`,
    apply(draft) {
      if (!EDITABLE_META_PATHS.includes(payload.path)) {
        throw commandError(
          COMMAND_CODES.metaPathNotEditable,
          `${payload.path} is not an editable document field`,
        )
      }

      setPath(draft.meta, payload.path, payload.value)

      const parsed = documentMetaSchema.safeParse(current(draft.meta))

      if (!parsed.success) {
        throw commandError(
          COMMAND_CODES.invalidMeta,
          `Not a valid value for ${payload.path}`,
          parsed.error,
        )
      }
    },
  }
}
