import {
  type Asset,
  type AssetId,
  type BlockId,
  type Node,
  type NodeId,
  type Removal,
  assetSchema,
  nodeIdSchema,
  nodeSchema,
} from '@motion-studio/schema'
import { type ThemePalette, themePaletteSchema } from '@motion-studio/theme'
import { MotionStudioError } from '@motion-studio/utils'
import { z } from 'zod'

/** Bumped with the document schema version: a payload is a document fragment. */
export const SUBTREE_VERSION = 1

/**
 * EDITOR_ENGINE.md § Clipboard. `origins` holds the index each root occupied, which is the one thing
 * paste-in-place needs and cannot recompute in another tab — ADR-068.
 */
export interface SerializedSubtree {
  readonly version: number
  readonly rootIds: readonly NodeId[]
  readonly nodes: Readonly<Record<NodeId, Node>>
  readonly assets: Readonly<Record<AssetId, Asset>>
  readonly origins: Readonly<Record<NodeId, number>>
  readonly theme?: { readonly palette: ThemePalette } | undefined
}

/**
 * Record keys stay plain patterns for the reason `document.schema.ts` states: a branded id schema
 * carries a transform, and Zod record keys take a string schema. The values are branded, and
 * `deserializeSubtree` drops any node whose key disagrees with its own `id`.
 */
export const serializedSubtreeSchema = z.object({
  version: z.number().int().positive(),
  rootIds: z.array(nodeIdSchema).min(1).max(500),
  nodes: z.record(z.string(), nodeSchema),
  assets: z.record(z.string(), assetSchema).default({}),
  origins: z.record(z.string(), z.number().int().min(0)).default({}),
  theme: z.object({ palette: themePaletteSchema }).optional(),
})

export const CLIPBOARD_CODES = {
  empty: 'CLIPBOARD_EMPTY',
  notJson: 'CLIPBOARD_NOT_JSON',
  invalidPayload: 'CLIPBOARD_INVALID_PAYLOAD',
  futureVersion: 'CLIPBOARD_FUTURE_VERSION',
  noBlocksAvailable: 'NO_BLOCKS_AVAILABLE',
  targetRejected: 'PASTE_TARGET_REJECTED',
} as const

export type ClipboardCode = (typeof CLIPBOARD_CODES)[keyof typeof CLIPBOARD_CODES]

export const clipboardError = (
  code: ClipboardCode,
  message: string,
  cause?: unknown,
): MotionStudioError => new MotionStudioError(message, code, cause)

/** One entry per unknown block, counting the nodes it cost — ADR-071. */
export interface RejectedBlock {
  readonly blockId: BlockId
  readonly nodes: number
}

export interface PasteReport {
  /** Nodes inserted. */
  readonly pasted: number
  /** Nodes in the payload, so `pasted < requested` is exactly the partial case. */
  readonly requested: number
  readonly rejected: readonly RejectedBlock[]
  /** What the sanitizer took out of the payload — FILE_FORMAT.md § Security. */
  readonly removed: readonly Removal[]
  /** The roots that landed, in document order, already selected. */
  readonly ids: readonly NodeId[]
  readonly message: string
}

/** The style payload: the source block, so the target's schema can be asked about each prop. */
export interface StyleClipboard {
  readonly blockId: BlockId
  /** Prop path → value, from the source's style control groups. */
  readonly props: Readonly<Record<string, unknown>>
}

export interface PasteTarget {
  readonly parentId: NodeId
  readonly slot: string
  readonly index: number
}
