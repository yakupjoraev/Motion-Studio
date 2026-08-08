import { studioDark } from '@motion-studio/theme'
import { createId } from '@motion-studio/utils'

import { type BlockId, blockId, nodeId } from '../ids/ids'

import type { MotionDocument, Node } from './document.types'

/** The block every document starts with. `packages/blocks` registers it — COMPONENT_LIBRARY.md § Layout. */
export const ROOT_BLOCK_ID: BlockId = blockId('container')

export const ROOT_SLOT = 'root'

export interface CreateEmptyOptions {
  readonly name?: string
  readonly generator?: string
  /** Injected so a test gets the same document twice — FILE_FORMAT.md § Migration rules 4. */
  readonly ids?: (prefix: string) => string
  /** Same reason: a document is only reproducible if its clock is. */
  readonly now?: () => Date
}

/**
 * A document with one node: a root container. Empty means empty — no starter hero, no sample text.
 * The canvas says "Drag a block to start" and means it.
 */
export function createEmptyDocument(options: CreateEmptyOptions = {}): MotionDocument {
  const generate = options.ids ?? createId
  const now = (options.now ?? (() => new Date()))().toISOString()
  // Through the constructor rather than a cast: an injected generator is arbitrary code, and a
  // document that starts with a malformed id would fail validation somewhere far from here.
  const root = nodeId(generate('node'))

  const rootNode: Node = {
    id: root,
    blockId: ROOT_BLOCK_ID,
    name: 'Page',
    parentId: null,
    slot: ROOT_SLOT,
    children: [],
    props: {},
    responsive: {},
    motion: {},
    effects: [],
    locked: false,
    hidden: false,
  }

  return {
    version: 1,
    meta: {
      id: generate('doc'),
      name: options.name ?? 'Untitled',
      createdAt: now,
      updatedAt: now,
      generator: options.generator ?? 'motion-studio@0.0.0',
      canvas: { width: 1440, background: 'surface-0' },
    },
    theme: studioDark,
    rootId: root,
    nodes: { [root]: rootNode },
    assets: {},
  }
}
