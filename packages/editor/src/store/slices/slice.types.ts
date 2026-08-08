import type { MotionDocument } from '@motion-studio/schema'
import type { StateCreator } from 'zustand'

import type { CommandContext } from '../../commands/command.types'
import type { EditorState } from '../store.types'

/**
 * Every slice factory takes the resolved options and returns a Zustand `StateCreator`. The mutator
 * tuple is listed outermost first, matching `createEditorStore`'s `subscribeWithSelector(devtools(…))`
 * — it is what types the third argument of `set` as a devtools action name.
 */
export type SliceCreator<T> = StateCreator<
  EditorState,
  [['zustand/subscribeWithSelector', never], ['zustand/devtools', never]],
  [],
  T
>

/**
 * The options after defaults, so no slice repeats a `?? …`. The clock and the id generator are
 * reached through `context`, which is the same pair every command receives.
 */
export interface ResolvedOptions {
  readonly context: CommandContext
  readonly coalesceWindow: number
  readonly initialDocument: MotionDocument
}
