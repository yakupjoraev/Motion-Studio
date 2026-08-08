import type { ThemeConfig } from '@motion-studio/theme'

import type { BreakpointId } from '../breakpoints/breakpoints'
import type { EffectInstance } from '../effects/effects.types'
import type { AssetId, BlockId, NodeId } from '../ids/ids'
import type { MotionChannel, MotionSpec } from '../motion/motion.types'

/**
 * EDITOR_ENGINE.md § Document model. The tree is **normalized**: `nodes` is a flat map and structure
 * lives in `children`. `parentId` is redundant with `children` and kept in sync by the commands,
 * because O(1) ancestor walks are what selection, hit testing, and drop validation all need.
 */
export interface Node {
  readonly id: NodeId
  readonly blockId: BlockId
  /** User-editable; defaults to the block name. */
  readonly name: string
  readonly parentId: NodeId | null
  /** Which slot of the parent block this child occupies. */
  readonly slot: string
  readonly children: readonly NodeId[]
  /** Validated against the block's schema in a second pass — the registry is not a dependency here. */
  readonly props: Readonly<Record<string, unknown>>
  /** Sparse overrides. Only overridden keys are stored — RESPONSIVE_ENGINE.md § Storage. */
  readonly responsive: Readonly<Partial<Record<BreakpointId, Record<string, unknown>>>>
  readonly motion: Readonly<Partial<Record<MotionChannel, MotionSpec>>>
  readonly effects: readonly EffectInstance[]
  readonly locked: boolean
  readonly hidden: boolean
}

export interface DocumentCanvas {
  readonly width: number
  /** A token name, not a colour: the canvas repaints with the theme. */
  readonly background: string
}

export interface DocumentMeta {
  readonly id: string
  readonly name: string
  readonly createdAt: string
  readonly updatedAt: string
  /** The app version that wrote the file, which is what makes a bug report actionable. */
  readonly generator: string
  readonly canvas: DocumentCanvas
  readonly template?: boolean | undefined
}

export type AssetKind = 'image' | 'video'

export type AssetSource =
  | { readonly type: 'url'; readonly url: string }
  | { readonly type: 'data'; readonly dataUrl: string }

export interface Asset {
  readonly id: AssetId
  readonly kind: AssetKind
  readonly source: AssetSource
  readonly width: number
  readonly height: number
  readonly alt: string
  readonly blurDataUrl?: string | undefined
}

export interface MotionDocument {
  readonly $schema?: string | undefined
  /** The **schema** version, independent of the app version — FILE_FORMAT.md § Versioning. */
  readonly version: number
  readonly meta: DocumentMeta
  readonly theme: ThemeConfig
  readonly rootId: NodeId
  readonly nodes: Readonly<Record<NodeId, Node>>
  readonly assets: Readonly<Record<AssetId, Asset>>
}

/** What a file is before it has been validated: parsed JSON and nothing more. */
export type UnknownDocument = Record<string, unknown>
