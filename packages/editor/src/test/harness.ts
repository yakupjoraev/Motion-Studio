import {
  type BlockRegistry,
  type MotionDocument,
  type NodeId,
  doc,
  fakeRegistry,
  fixtureBlockId,
  nodeId,
  tree,
  treeId,
} from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'
import type { Patch } from 'immer'
import { z } from 'zod'

import type { Command, CommandContext } from '../commands/command.types'
import { applyCommands } from '../commands/dispatch'
import { createEditorStore } from '../store/create-store'
import type { EditorStore } from '../store/store.types'

import { TEST_NOW } from './create-test-store'

/**
 * The blocks the command tests need: one permissive container, one section whose `children` slot
 * takes two cards and nothing else, one card with a real props schema, and one block that declares
 * no slot at all.
 */
export function commandRegistry(): BlockRegistry {
  const cardProps = z.object({
    columns: z.number().min(1).max(6).default(1),
    title: z.string().default(''),
  })

  return fakeRegistry({
    container: {},
    section: {
      slots: [
        { name: 'root', label: 'Root', accepts: '*', minChildren: 0, maxChildren: null },
        {
          name: 'children',
          label: 'Children',
          accepts: [fixtureBlockId('card'), fixtureBlockId('container')],
          minChildren: 0,
          maxChildren: 2,
        },
      ],
    },
    card: {
      propsSchema: cardProps,
      defaults: { columns: 1, title: '' },
      capabilities: {
        resizable: true,
        fullWidth: false,
        requiresBackdrop: false,
        supportsMotion: ['entrance', 'hover'],
        costClass: 'cheap',
      },
    },
    leaf: { slots: [] },
    shell: {
      slots: [
        { name: 'root', label: 'Root', accepts: '*', minChildren: 0, maxChildren: null },
        {
          name: 'children',
          label: 'Children',
          accepts: '*',
          minChildren: 0,
          maxChildren: null,
          defaultChildren: [fixtureBlockId('card'), fixtureBlockId('card')],
        },
      ],
    },
  })
}

/** `root → a b c d`, the shape every structural assertion in this package is written against. */
export const FLAT_TREE: Readonly<Record<string, readonly string[]>> = {
  root: ['a', 'b', 'c', 'd'],
}

export const id = treeId

export interface Harness {
  readonly store: EditorStore
  readonly context: CommandContext
  readonly document: () => MotionDocument
}

/**
 * A store and a command context sharing one id counter, which is what lets a test dispatch through
 * the store and still read a command's raw patches — TESTING.md § Determinism.
 */
export function harness(overrides: Partial<HarnessOptions> = {}): Harness {
  const nextId = counterIds()
  const generateId = overrides.generateId ?? ((): NodeId => nodeId(nextId()))
  const registry = overrides.registry ?? commandRegistry()
  const document = overrides.document ?? doc(tree(FLAT_TREE))
  const now = overrides.now ?? ((): number => TEST_NOW)
  const store = createEditorStore({
    registry,
    generateId,
    document,
    now,
    coalesceWindow: overrides.coalesceWindow ?? 0,
  })

  return {
    store,
    context: { registry, generateId, now },
    document: () => store.getState().document,
  }
}

export interface HarnessOptions {
  readonly registry: BlockRegistry
  readonly document: MotionDocument
  readonly generateId: () => NodeId
  /** `0` disables coalescing, which is what every test that is not about coalescing wants. */
  readonly coalesceWindow: number
  /** A test that is about coalescing hands in a clock it can move. */
  readonly now: () => number
}

/** The patches one command would write, without committing it. */
export function capturePatches({ store, context }: Harness, command: Command): readonly Patch[] {
  return applyCommands(store.getState().document, [command], context)?.patches ?? []
}

/** The `code` of the `MotionStudioError` a command throws, for a test that names the guard. */
export function codeOf(run: () => void): string {
  try {
    run()
  } catch (error) {
    return error instanceof Error && 'code' in error ? String(error.code) : 'NOT_A_COMMAND_ERROR'
  }

  return 'NO_ERROR'
}
