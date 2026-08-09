import type { NodeId } from '@motion-studio/schema'

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
