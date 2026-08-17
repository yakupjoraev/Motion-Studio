'use client'

import { type Command, commands } from '@motion-studio/editor'
import type { BreakpointId, NodeId } from '@motion-studio/schema'
import { useSyncExternalStore } from 'react'

/** RESPONSIVE_ENGINE.md § Guardrail: three overrides inside half a minute is the pattern it catches. */
export const HINT_EDIT_THRESHOLD = 3
export const HINT_WINDOW_MS = 30_000

/**
 * The edit's destination — RESPONSIVE_ENGINE.md § Editing semantics. `base` is the unconditional
 * value; anything else writes an override that applies at that breakpoint and up.
 */
export function propCommand(
  breakpoint: BreakpointId,
  nodeId: NodeId,
  path: string,
  value: unknown,
): Command {
  return breakpoint === 'base'
    ? commands.setProp({ nodeId, path, value })
    : commands.setResponsiveProp({ nodeId, breakpoint, path, value })
}

/**
 * The coalesce key carries the breakpoint, so scrubbing at `md` and then at `lg` is two history
 * entries rather than one merged mess.
 */
export const editCoalesceKey = (breakpoint: BreakpointId, path: string): string =>
  `inspector:${path}:${breakpoint}`

/**
 * ADR-165. Module state, because the hint is shown once per *session* and a session is this tab:
 * `localStorage` would silence it forever, and the store would carry a field no document ever loads.
 */
const tracker = {
  edits: [] as { readonly key: string; readonly at: number }[],
  dismissed: false,
  shown: false,
  listeners: new Set<() => void>(),
}

const notify = (): void => {
  for (const listener of tracker.listeners) {
    listener()
  }
}

/**
 * Called for every responsive-prop command. Edits at `base` are not counted — base is the case the
 * hint exists to send the user back to.
 *
 * Counted by coalesce key rather than by command: a slider drag dispatches thirty writes a second
 * that merge into one history entry, and a hint that read those as thirty separate edits would fire
 * before the user had finished the first one.
 */
export function recordResponsiveEdit(key: string, now: number = Date.now()): void {
  if (tracker.dismissed || tracker.shown) {
    return
  }

  const fresh = tracker.edits.filter((edit) => now - edit.at < HINT_WINDOW_MS && edit.key !== key)

  tracker.edits = [...fresh, { key, at: now }]

  if (tracker.edits.length >= HINT_EDIT_THRESHOLD) {
    tracker.shown = true
    notify()
  }
}

export function dismissResponsiveHint(): void {
  tracker.dismissed = true
  notify()
}

/** Tests only: module state outlives a test file's `beforeEach` unless something clears it. */
export function resetResponsiveHint(): void {
  tracker.edits = []
  tracker.dismissed = false
  tracker.shown = false
  notify()
}

const subscribe = (listener: () => void): (() => void) => {
  tracker.listeners.add(listener)

  return () => {
    tracker.listeners.delete(listener)
  }
}

const isVisible = (): boolean => tracker.shown && !tracker.dismissed

/** Server render has no session and therefore no hint — the same answer as a fresh tab. */
export const useResponsiveHintVisible = (): boolean =>
  useSyncExternalStore(subscribe, isVisible, () => false)
