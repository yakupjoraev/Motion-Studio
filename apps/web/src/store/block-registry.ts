'use client'

import { type BlockRegistry, createRegistry } from '@motion-studio/schema'

/**
 * The catalogue's 72 definitions, out of the studio's first load.
 *
 * They were 69.4 kB gzip of a 250 kB budget the route missed by 120 (ADR-312), and nothing needs a
 * definition to paint the shell: every consumer reads one when a command runs, a drag starts, a node
 * is selected or a document is imported. So the registry arrives on its own chunk, in parallel with
 * the canvas island, and the six eager modules hold this instead.
 *
 * `get` and the rest stay synchronous. A registry that returned promises would push `await` into
 * `insertNode`, drop resolution and the inspector's render — the seam ARCHITECTURE.md § The registry
 * seam keeps narrow precisely so it can be swapped, not so it can be made async.
 */
let loaded: BlockRegistry = createRegistry([])
let pending: Promise<BlockRegistry> | null = null

const listeners = new Set<() => void>()

export const deferredBlockRegistry: BlockRegistry = {
  get: (id) => loaded.get(id),
  require: (id) => loaded.require(id),
  list: () => loaded.list(),
  byCategory: (category) => loaded.byCategory(category),
}

/**
 * Idempotent: the shell calls it once on mount, and anything that needs the catalogue sooner can
 * await the same promise rather than starting a second request.
 */
export function loadBlockRegistry(): Promise<BlockRegistry> {
  pending ??= import('@motion-studio/blocks/registry').then(({ blockRegistry }) => {
    loaded = blockRegistry

    for (const listener of listeners) {
      listener()
    }

    return blockRegistry
  })

  return pending
}

export const blockRegistryLoaded = (): boolean => loaded.list().length > 0

/**
 * Fills the registry synchronously, for a test that is measuring behaviour rather than bytes.
 *
 * `apps/web/src/test/setup.ts` calls it with the real `blockRegistry` — the contract's "use the real
 * thing or the injected fake", and the reason a studio unit test does not have to await a chunk that
 * exists for the browser's benefit.
 */
export function primeBlockRegistry(registry: BlockRegistry): void {
  loaded = registry
  pending = Promise.resolve(registry)

  for (const listener of listeners) {
    listener()
  }
}

/** For the one consumer that renders before an interaction — the inspector, on a restored selection. */
export function subscribeToBlockRegistry(listener: () => void): () => void {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
