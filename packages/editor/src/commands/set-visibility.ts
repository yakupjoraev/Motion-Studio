import type { NodeId } from '@motion-studio/schema'

import type { Command } from './command.types'
import { requireNode } from './guards'

export interface SetVisibilityPayload {
  readonly ids: readonly NodeId[]
  readonly hidden: boolean
}

/**
 * The eye icon in the layers tree — an editor flag on the node. The per-breakpoint kind of hiding is
 * a prop (`props.hidden` with an override), because that one exports as a class —
 * RESPONSIVE_ENGINE.md § Which properties are responsive.
 */
export function setVisibility(payload: SetVisibilityPayload): Command<SetVisibilityPayload> {
  return {
    type: 'setVisibility',
    label: payload.hidden ? 'Hide' : 'Show',
    payload,
    apply(draft) {
      for (const id of payload.ids) {
        requireNode(draft, id).hidden = payload.hidden
      }
    },
  }
}
