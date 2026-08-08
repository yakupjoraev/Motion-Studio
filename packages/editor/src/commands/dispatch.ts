import type { MotionDocument } from '@motion-studio/schema'
import { type Patch, enablePatches, produceWithPatches } from 'immer'

import type { Command, CommandContext } from './command.types'

// Patches are opt-in in Immer 10 and they are this project's history unit — TECH_STACK.md § Immer 10.
enablePatches()

export interface CommandOutcome {
  readonly document: MotionDocument
  readonly patches: readonly Patch[]
  readonly inversePatches: readonly Patch[]
}

/**
 * STATE_MANAGEMENT.md § Dispatch, as a pure function so the pipeline is testable without a store.
 *
 * `null` means the commands produced **no patches**, and the caller drops them: clicking an
 * already-active alignment button must not create an undo step. Any command in the list may throw —
 * the guards in EDITOR_ENGINE.md § Structural commands do — and the throw propagates with the
 * document untouched, because Immer discards a draft whose recipe threw.
 */
export function applyCommands(
  document: MotionDocument,
  commands: readonly Command[],
  context: CommandContext,
): CommandOutcome | null {
  const [next, patches, inversePatches] = produceWithPatches(document, (draft) => {
    for (const command of commands) {
      command.apply(draft, context)
    }
  })

  if (patches.length === 0) {
    return null
  }

  return { document: next, patches, inversePatches }
}
