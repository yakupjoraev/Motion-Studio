import { type NodeId, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { createId } from '@motion-studio/utils'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

import { createClipboardSlice } from './slices/clipboard-slice'
import { createDocumentSlice } from './slices/document-slice'
import { createHistorySlice } from './slices/history-slice'
import { createSelectionSlice } from './slices/selection-slice'
import type { ResolvedOptions } from './slices/slice.types'
import { createThemeSlice } from './slices/theme-slice'
import { createUiSlice } from './slices/ui-slice'
import { createViewportSlice } from './slices/viewport-slice'
import type { EditorState, EditorStore, EditorStoreOptions } from './store.types'

/** EDITOR_ENGINE.md § Coalescing. `0` in tests unless the test is about coalescing. */
const DEFAULT_COALESCE_WINDOW_MS = 400

/**
 * `createEmptyDocument` names two things — the root node and the document — and the store is given
 * one generator for nodes. Deriving the document id from the same generator is what keeps a store
 * built twice from the same options byte-identical, which is what the golden files and the property
 * tests rely on.
 */
const documentIds =
  (generateId: () => NodeId) =>
  (prefix: string): string => {
    const generated = generateId()

    return prefix === 'node' ? generated : `${prefix}_${generated.replace(/^node_/, '')}`
  }

function resolveOptions(options: EditorStoreOptions): ResolvedOptions {
  const generateId = options.generateId ?? ((): NodeId => nodeId(createId('node')))
  const now = options.now

  return {
    context: { registry: options.registry, generateId, now },
    coalesceWindow: options.coalesceWindow ?? DEFAULT_COALESCE_WINDOW_MS,
    initialDocument:
      options.document ??
      createEmptyDocument({ ids: documentIds(generateId), now: () => new Date(now()) }),
  }
}

/**
 * STATE_MANAGEMENT.md § Store shape. One store, seven slices, merged flat.
 *
 * `devtools` is enabled in development only — the action names every slice passes to `set` are the
 * point of it, and shipping the listener to production costs a subscription per store write.
 *
 * `persist` is **not** used, and that is deliberate: persistence is explicit and debounced to
 * IndexedDB (prompt 50), because writing the whole document to storage on every keystroke is a jank
 * source and because the middleware's synchronous rehydrate would race the boot script.
 */
export function createEditorStore(options: EditorStoreOptions): EditorStore {
  const resolved = resolveOptions(options)

  return create<EditorState>()(
    subscribeWithSelector(
      devtools(
        (...a) => ({
          ...createDocumentSlice(resolved)(...a),
          ...createSelectionSlice()(...a),
          ...createViewportSlice()(...a),
          ...createHistorySlice(resolved)(...a),
          ...createClipboardSlice()(...a),
          ...createUiSlice()(...a),
          ...createThemeSlice()(...a),
        }),
        { name: 'motion-studio', enabled: process.env['NODE_ENV'] === 'development' },
      ),
    ),
  )
}
