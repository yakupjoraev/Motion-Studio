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
