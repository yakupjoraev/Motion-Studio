import type { ClipboardSlice } from '../store.types'

import type { SliceCreator } from './slice.types'

/**
 * **A stub, on purpose.** Prompt 16 fills it: `copy`, `cut`, `paste`, `pasteStyle`, the system
 * clipboard with its `motion-studio` marker, and id remapping. Only the state exists here, so nothing
 * offers an operation it cannot perform — EDITOR_ENGINE.md § Clipboard.
 */
export const createClipboardSlice = (): SliceCreator<ClipboardSlice> => () => ({
  clipboard: { nodes: null, style: null },
})
