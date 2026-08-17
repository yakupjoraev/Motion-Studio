import type { NodeId } from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'

import type { CanvasRect, ViewportRect, ViewportTransform } from './coords/index'

/**
 * What geometry needs off a node, and nothing else. The shape is `schema`'s `Node`, narrowed: the
 * canvas has no use for props, motion, or effects, and a narrower port is a smaller fake in a test.
 */
export interface CanvasSceneNode {
  readonly parentId: NodeId | null
  readonly name: string
  readonly children: readonly NodeId[]
  readonly locked: boolean
  readonly hidden: boolean
}

/** EDITOR_ENGINE.md § Modes. Named here so the canvas can ask for one without importing `editor`. */
export type SelectionMode = 'replace' | 'add' | 'toggle' | 'range'

/** Canvas units, per side, in the order the inspector shows them. */
export interface CanvasEdges {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export interface NodeSpacing {
  readonly padding: CanvasEdges
  readonly margin: CanvasEdges
}

/**
 * ADR-077. State comes in as getters, read inside handlers and effects rather than during render, so
 * an edit to the document changes nothing React can see and the canvas root does not re-render.
 */
export interface CanvasScene {
  node(id: NodeId): CanvasSceneNode | undefined
  isolationId(): NodeId | null
  selectedIds(): readonly NodeId[]
  /**
   * Bumps on every document change — the rect cache's cue that the geometry it holds is stale. This
   * is the one getter read during render rather than in a handler, so the host is what must
   * re-render when it changes; everything else here is free to be read from a ref.
   */
  version(): number
  /** ADR-099. Resolved props at the current breakpoint, which is a question only the host can answer. */
  spacing(id: NodeId): NodeSpacing | undefined
  /** ADR-092. Fires when any getter's answer may have changed; the overlay layer is what listens. */
  subscribe(listener: () => void): () => void
}

/** PRODUCT.md § 3, in the order the menu shows them. */
export type CanvasMenuAction =
  | 'duplicate'
  | 'copy'
  | 'paste'
  | 'pasteStyle'
  | 'delete'
  | 'bringForward'
  | 'sendBackward'
  | 'wrap'
  | 'unwrap'
  | 'addMotion'
  | 'copyReact'
  | 'resetOverrides'

export interface CanvasMenuPort {
  /** The reason the action is unavailable, or `undefined` when it is available. */
  unavailable(action: CanvasMenuAction): string | undefined
  run(action: CanvasMenuAction): void
}

/** Canvas units. ADR-097: a resize reports a size and never a position. */
export interface CanvasSize {
  readonly width: number
  readonly height: number
}

export interface CanvasResizePort {
  /**
   * ADR-108. Whether this node can take a size at all — the block's `capabilities.resizable`. The
   * canvas cannot answer it: capabilities live in the registry, which is the host's to import.
   */
  resizable(id: NodeId): boolean
  /** One `setProp` per finished gesture, applied synchronously like the selection port. */
  commit(id: NodeId, size: CanvasSize): void
}

/** ADR-100. `viewport.motionPaused` in the store; prompt 31's scheduler is the other consumer. */
export interface CanvasMotionPort {
  paused(): boolean
  setPaused(paused: boolean): void
  replay(): void
}

/**
 * Intent out. Every one of these is a store command in the application that mounts the canvas.
 *
 * They apply **synchronously**: the canvas calls one and then reads `CanvasScene` back to announce
 * what happened, because for `add` and `toggle` the resulting set is the store's answer and not the
 * canvas's. A port that defers its write — React state rather than a store `set` — announces the
 * previous selection.
 */
export interface CanvasSelectionPort {
  select(ids: readonly NodeId[], mode: SelectionMode): void
  clear(): void
  enter(id: NodeId): void
  exit(): void
  hover(id: NodeId | null): void
  /** ADR-080: the canvas resolves the step and has no coordinates to apply it to. */
  nudge(dx: number, dy: number): void
}

/**
 * The measured half of the canvas, handed out on mount — the one thing a host cannot compute for
 * itself, because the transform lives in a ref inside the canvas and the artboard's height is
 * whatever the content came to.
 *
 * Deliberately four readers and two commands: everything else a host wants to do to the viewport it
 * does by rendering a different `artboardWidth`.
 */
export interface CanvasHandle {
  /** Canvas units — the artboard's own box, which is what a document fit measures. */
  documentRect(): CanvasRect
  /** Screen pixels — the canvas element's box. */
  viewportRect(): ViewportRect
  /**
   * Screen pixels — one node's measured box, or `undefined` for a node the cache has not seen. It is
   * the rect cache narrowed to one question, which is what a host needs to register the node as a
   * drop zone without holding the cache itself (ADR-181).
   */
  nodeRect(id: NodeId): Rect | undefined
  /** The live transform. Read it in a handler, never during render. */
  transform(): ViewportTransform
  /** `fitToRect` on the artboard, capped at 1:1 — CANVAS.md § Zoom. */
  fitDocument(): void
  /** Screen pixels. What auto-pan during a drag moves the scene by — DRAG_AND_DROP.md § Auto-behaviours. */
  panBy(dx: number, dy: number): void
  /**
   * Drops the cached geometry and reads it again — ADR-183. The cache re-measures when the document
   * changes or a node resizes, and a node that *moved* does neither: an entrance animation leaves its
   * rect where the first frame was. A host asks for this before it starts trusting the rects, which in
   * practice means at the start of a drag.
   */
  remeasure(): void
  /**
   * Pans the least amount that brings a node into view, leaving the zoom alone — CANVAS.md § Pan.
   * A node already in view moves nothing.
   *
   * Returns whether the node was measured at all: a node inserted this tick has not been through a
   * rect pass yet, and a caller that inserted it needs to know the difference between "already
   * visible" and "not there yet".
   */
  reveal(id: NodeId): boolean
}
