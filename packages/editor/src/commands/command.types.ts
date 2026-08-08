import type { BlockRegistry, MotionDocument, NodeId } from '@motion-studio/schema'
import type { Draft } from 'immer'

/**
 * EDITOR_ENGINE.md § Commands. A command is data plus a pure mutation, and that is the whole
 * abstraction: nothing else in the package writes to the document.
 *
 * `draft` is `Draft<MotionDocument>` rather than `MotionDocument` because the document's fields are
 * `readonly` — the document that leaves a command is immutable, and `Draft` is the same shape with
 * that guarantee suspended for the length of `apply`.
 */
export interface Command<T = unknown> {
  readonly type: string
  /** User-visible, shown in the undo tooltip: "Set background", never "setProp". */
  readonly label: string
  readonly payload: T
  readonly coalesceKey?: string | undefined
  apply(draft: Draft<MotionDocument>, context: CommandContext): void
}

/**
 * Injected, which is what makes a command deterministic in a test: pass a counter as `generateId`
 * and a frozen clock as `now` — TESTING.md § Determinism.
 */
export interface CommandContext {
  readonly registry: BlockRegistry
  readonly generateId: () => NodeId
  readonly now: () => number
}
