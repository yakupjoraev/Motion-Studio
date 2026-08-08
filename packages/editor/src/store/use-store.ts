import { createRegistry } from '@motion-studio/schema'

import { createEditorStore } from './create-store'
import type { EditorStore } from './store.types'

/**
 * The app-level singleton. This is the **composition root** and the only place in the package that
 * reads a wall clock: everything downstream receives `now` through `CommandContext`, which is what
 * makes history timestamps and generated ids reproducible in a test — ADR-056.
 *
 * The registry starts empty because `packages/editor` must not depend on `packages/blocks`
 * (ARCHITECTURE.md § Dependency graph). `apps/web` builds a store with the real catalogue once the
 * registry exists (prompt 22); until then an insert into this store has no block to insert.
 */
export const useEditorStore: EditorStore = createEditorStore({
  registry: createRegistry([]),
  now: () => Date.now(),
})
