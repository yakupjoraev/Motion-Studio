'use client'

import { blockRegistry } from '@motion-studio/blocks'
import { NODE_ID_ATTRIBUTE } from '@motion-studio/canvas'
import { commands } from '@motion-studio/editor'
import type { NodeId } from '@motion-studio/schema'
import type { ControlDescriptor } from '@motion-studio/schema'
import { cssVariable } from '@motion-studio/ui'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { editCoalesceKey, propCommand, recordResponsiveEdit } from './use-responsive-edit'

const valueAt = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((held, key) => {
    if (typeof held !== 'object' || held === null) {
      return undefined
    }

    return (held as Record<string, unknown>)[key]
  }, source)

/** ~30 Hz: a frame's worth of edits collapse into one store write — ADR-111. */
export const PREVIEW_INTERVAL_MS = 33

export interface ControlCommit {
  /** Per frame during a gesture. A variable write when the block reads one, a throttled commit otherwise. */
  readonly onChange: (value: unknown) => void
  /** Once, on release. Always a command. */
  readonly onCommit: (value: unknown) => void
  /** Removes the value at this breakpoint, or the prop itself at base. */
  readonly onReset: () => void
}

/**
 * The load-bearing hook of the inspector — STATE_MANAGEMENT.md § Transient state.
 *
 * Every edit becomes **one** history entry, whether it is one node or five: the commands carry a
 * coalesce key built from the path and the breakpoint, so the thirty writes a drag makes in a second
 * merge into the entry the first one opened.
 */
export function useControlCommit(
  descriptor: ControlDescriptor,
  nodeIds: readonly NodeId[],
): ControlCommit {
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<unknown>(null)
  const held = useRef({ descriptor, nodeIds, breakpoint })

  held.current = { descriptor, nodeIds, breakpoint }

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
      }
    },
    [],
  )

  const commit = useCallback((value: unknown) => {
    const { descriptor: control, nodeIds: ids, breakpoint: active } = held.current
    const state = useStudioStore.getState()
    const key = editCoalesceKey(active, control.path)

    const list = ids.map((nodeId) => propCommand(active, nodeId, control.path, value))

    if (list.length === 0) {
      return
    }

    state.dispatchBatch(list, `Set ${control.label.toLowerCase()}`, key)

    if (active !== 'base') {
      recordResponsiveEdit(key)
    }
  }, [])

  return useMemo<ControlCommit>(() => {
    const variable = cssVariable(descriptor)

    return {
      onChange(value) {
        // The fast path: the block reads this variable, so the drag previews with no store write at
        // all. No block in the catalogue declares one yet, which is why the branch below is the one
        // every control takes today — ADR-111.
        if (variable !== undefined) {
          for (const id of held.current.nodeIds) {
            document
              .querySelector<HTMLElement>(`[${NODE_ID_ATTRIBUTE}="${id}"]`)
              ?.style.setProperty(variable, String(value))
          }

          return
        }

        pending.current = value

        if (timer.current !== null) {
          return
        }

        timer.current = setTimeout(() => {
          timer.current = null
          commit(pending.current)
        }, PREVIEW_INTERVAL_MS)
      },

      onCommit(value) {
        if (timer.current !== null) {
          clearTimeout(timer.current)
          timer.current = null
        }

        commit(value)
      },

      onReset() {
        const { nodeIds: ids, breakpoint: active, descriptor: control } = held.current
        const state = useStudioStore.getState()

        if (active === 'base') {
          // At base there is no override to remove, so a reset writes the block's own default back.
          // Writing `undefined` instead would leave a key the file format has no place for.
          const list = ids.flatMap((nodeId) => {
            const node = state.document.nodes[nodeId]
            const defaults =
              node === undefined ? undefined : blockRegistry.get(node.blockId)?.defaults

            return defaults === undefined
              ? []
              : [
                  commands.setProp({
                    nodeId,
                    path: control.path,
                    value: valueAt(defaults, control.path),
                  }),
                ]
          })

          state.dispatchBatch(list, `Reset ${control.label.toLowerCase()}`)

          return
        }

        state.dispatchBatch(
          ids.map((nodeId) =>
            commands.clearResponsiveProp({ nodeId, breakpoint: active, path: control.path }),
          ),
          `Reset ${control.label.toLowerCase()}`,
        )
      },
    }
  }, [commit, descriptor])
}
