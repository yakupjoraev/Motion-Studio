import type { NodeId } from '../ids/ids'

/**
 * EDITOR_ENGINE.md § Invariants, one code each. The codes are what an import report groups by, so
 * they are stable strings rather than positions in this list.
 */
export const DOCUMENT_ERROR_CODES = {
  /** 1. `rootId` exists in `nodes`. */
  missingRoot: 'MISSING_ROOT',
  /** 2. Root's `parentId` is null; every other node's parent exists. */
  badParent: 'BAD_PARENT',
  /** 3. `nodes[p].children` contains `c` ⟺ `nodes[c].parentId === p`. */
  parentChildMismatch: 'PARENT_CHILD_MISMATCH',
  /** 4. No cycles. */
  cycle: 'CYCLE',
  /** 5. No orphans — every node is reachable from the root. */
  orphan: 'ORPHAN',
  /** 6. Every `blockId` exists in the registry. */
  unknownBlock: 'UNKNOWN_BLOCK',
  /** 7. Every node's `props` parse against its block's schema. */
  invalidProps: 'INVALID_PROPS',
  /** 8. Every child's `slot` is declared by its parent block. */
  unknownSlot: 'UNKNOWN_SLOT',
  /** 9. `children` contains no duplicates. */
  duplicateChild: 'DUPLICATE_CHILD',
} as const

export type DocumentErrorCode = (typeof DOCUMENT_ERROR_CODES)[keyof typeof DOCUMENT_ERROR_CODES]

export interface DocumentError {
  readonly code: DocumentErrorCode
  readonly message: string
  readonly nodeId?: NodeId
}

/** `nodeId` is absent rather than `undefined`: the report is serialised into an import dialog. */
export const problem = (code: DocumentErrorCode, message: string, id?: NodeId): DocumentError =>
  id === undefined ? { code, message } : { code, message, nodeId: id }
