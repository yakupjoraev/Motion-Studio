'use client'

import type { BlockRegistry } from '@motion-studio/schema'
import { useSyncExternalStore } from 'react'

import {
  blockRegistryLoaded,
  deferredBlockRegistry,
  subscribeToBlockRegistry,
} from './block-registry'

/**
 * The registry, and a render when its chunk lands — ADR-312.
 *
 * Only a component that reads a definition *while rendering* needs this. A command, a drag or an
 * import reads one when it runs, by which time the chunk has long arrived, and those hold
 * `deferredBlockRegistry` directly.
 */
export function useBlockRegistry(): BlockRegistry {
  useSyncExternalStore(subscribeToBlockRegistry, blockRegistryLoaded, () => false)

  return deferredBlockRegistry
}
