'use client'

import { type BreakpointId, CASCADE_ORDER, type NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

export interface ControlValue {
  /** The resolved value, or the first one when the selection disagrees. */
  readonly value: unknown
  /** UI_GUIDELINES.md § Multi-selection: the selection holds more than one value for this path. */
  readonly mixed: boolean
  /** The breakpoint the value came from, when it came from an override. */
  readonly overriddenAt: BreakpointId | undefined
  /** Differs from the block's own default, so the row offers a reset. */
  readonly modified: boolean
}

const at = (props: Readonly<Record<string, unknown>>, path: string): unknown =>
  path.split('.').reduce<unknown>((held, key) => {
    if (typeof held !== 'object' || held === null) {
      return undefined
    }

    return (held as Record<string, unknown>)[key]
  }, props)

/** Deep enough for the shapes a prop takes: scalars, and the flat objects a spacing box holds. */
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/**
 * The value a control shows, read across the whole selection. It resolves through the responsive
 * cascade the way the canvas does — RESPONSIVE_ENGINE.md § Resolution — and reports where the value
 * came from, because a row with an override draws the accent dot and names its breakpoint.
 */
export function useControlValue(path: string, nodeIds: readonly NodeId[]): ControlValue {
  const version = useStudioStore((state) => state.version)
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the trigger — a document edit is what changes the answer, and there is nothing to read off the number itself
  return useMemo<ControlValue>(() => {
    const state = useStudioStore.getState()
    const values: unknown[] = []
    let overriddenAt: BreakpointId | undefined
    let modified = false

    for (const id of nodeIds) {
      const node = state.document.nodes[id]

      if (node === undefined) {
        continue
      }

      const source = sourceBreakpoint(node.responsive, path, breakpoint)
      const value =
        source === undefined ? at(node.props, path) : at(node.responsive[source] ?? {}, path)

      values.push(value)
      overriddenAt = overriddenAt ?? source
      modified = modified || at(node.props, path) !== undefined
    }

    return {
      value: values[0],
      mixed: values.some((one) => !same(one, values[0])),
      overriddenAt,
      modified,
    }
  }, [breakpoint, nodeIds, path, version])
}

/** The last breakpoint at or below the active one that overrides this path — the cascade, walked back. */
function sourceBreakpoint(
  responsive: Readonly<Partial<Record<BreakpointId, Record<string, unknown>>>>,
  path: string,
  breakpoint: BreakpointId,
): BreakpointId | undefined {
  const reach = CASCADE_ORDER.indexOf(breakpoint)

  for (let index = reach; index > 0; index -= 1) {
    const id = CASCADE_ORDER[index]

    if (id !== undefined && at(responsive[id] ?? {}, path) !== undefined) {
      return id
    }
  }

  return undefined
}
