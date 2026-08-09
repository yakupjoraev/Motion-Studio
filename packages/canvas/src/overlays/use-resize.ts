'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, useCallback, useEffect, useMemo, useRef } from 'react'

import type { CanvasResizePort, CanvasSize } from '../canvas.types'
import { NODE_ID_ATTRIBUTE } from '../hit/hit-test'
import type { RectCache } from '../rects/rect-cache'
import { NUDGE_STEP, NUDGE_STEP_COARSE } from '../selection/use-keyboard-selection'
import type { ViewportHandle } from '../viewport/use-viewport'

/** Written on the node while a drag is live; `NodeWrapper` is what reads them back. */
export const RESIZE_VARS = { width: '--ms-node-w', height: '--ms-node-h' } as const

/** Canvas units. A node with no extent has no handles to grab. */
export const MIN_SIZE = 1

export type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface ResizeHandleSpec {
  readonly direction: ResizeDirection
  readonly label: string
  readonly cursor: string
  /** Percentages of the node's box: where the handle sits. */
  readonly x: number
  readonly y: number
  /** Which way the edge this handle owns moves. Zero means the axis is not this handle's. */
  readonly signX: -1 | 0 | 1
  readonly signY: -1 | 0 | 1
}

export const RESIZE_HANDLES: readonly ResizeHandleSpec[] = [
  { direction: 'nw', label: 'top-left', cursor: 'nwse-resize', x: 0, y: 0, signX: -1, signY: -1 },
  { direction: 'n', label: 'top', cursor: 'ns-resize', x: 50, y: 0, signX: 0, signY: -1 },
  { direction: 'ne', label: 'top-right', cursor: 'nesw-resize', x: 100, y: 0, signX: 1, signY: -1 },
  { direction: 'e', label: 'right', cursor: 'ew-resize', x: 100, y: 50, signX: 1, signY: 0 },
  {
    direction: 'se',
    label: 'bottom-right',
    cursor: 'nwse-resize',
    x: 100,
    y: 100,
    signX: 1,
    signY: 1,
  },
  { direction: 's', label: 'bottom', cursor: 'ns-resize', x: 50, y: 100, signX: 0, signY: 1 },
  {
    direction: 'sw',
    label: 'bottom-left',
    cursor: 'nesw-resize',
    x: 0,
    y: 100,
    signX: -1,
    signY: 1,
  },
  { direction: 'w', label: 'left', cursor: 'ew-resize', x: 0, y: 50, signX: -1, signY: 0 },
]

export interface ResizeModifiers {
  readonly shift: boolean
  readonly alt: boolean
}

/** Which edges a gesture moves. A handle's own signs, or an arrow key's, or the two multiplied. */
export interface ResizeSigns {
  readonly signX: number
  readonly signY: number
}

/**
 * Pure, and the whole of the resize maths. `Alt` applies the drag to both edges — ADR-097, which is
 * what from-centre comes to for a node whose position its parent decides. `Shift` keeps the ratio.
 */
export function resizeDraft(
  start: CanvasSize,
  delta: { readonly x: number; readonly y: number },
  signs: ResizeSigns,
  modifiers: ResizeModifiers,
): CanvasSize {
  const factor = modifiers.alt ? 2 : 1
  const width = Math.max(MIN_SIZE, start.width + signs.signX * delta.x * factor)
  const height = Math.max(MIN_SIZE, start.height + signs.signY * delta.y * factor)

  if (!modifiers.shift || start.width === 0 || start.height === 0) {
    return { width, height }
  }

  const ratio = start.width / start.height

  return signs.signX === 0
    ? { width: Math.max(MIN_SIZE, height * ratio), height }
    : { width, height: Math.max(MIN_SIZE, width / ratio) }
}

export interface ResizeHookOptions {
  readonly rootRef: RefObject<HTMLElement | null>
  readonly cache: RectCache
  readonly viewport: ViewportHandle
  readonly resize: CanvasResizePort | undefined
  /** The single selected node, which is the only case handles are drawn for. */
  readonly selectedId: () => NodeId | null
}

export interface ResizeHandle {
  /** A press on a handle. Everything after it is pointer capture and variable writes. */
  start(event: React.PointerEvent, spec: ResizeHandleSpec): void
  /** Arrows on a focused handle: 1 unit, `Shift` for ten. */
  key(event: React.KeyboardEvent, spec: ResizeHandleSpec): void
}

const ARROW_SIGNS: Readonly<Record<string, ResizeSigns>> = {
  ArrowLeft: { signX: -1, signY: 0 },
  ArrowRight: { signX: 1, signY: 0 },
  ArrowUp: { signX: 0, signY: -1 },
  ArrowDown: { signX: 0, signY: 1 },
}

/**
 * The transient pattern of STATE_MANAGEMENT.md § High-frequency values: the draft is a CSS variable
 * on the node, and the store hears one `setProp` on release.
 */
export function useResize({
  rootRef,
  cache,
  viewport,
  resize,
  selectedId,
}: ResizeHookOptions): ResizeHandle {
  const latest = useRef({ cache, resize, selectedId })

  latest.current = { cache, resize, selectedId }

  const nodeElement = useCallback(
    (id: NodeId): HTMLElement | null =>
      rootRef.current?.querySelector<HTMLElement>(`[${NODE_ID_ATTRIBUTE}="${id}"]`) ?? null,
    [rootRef],
  )

  /** Canvas units, from the cache rather than the DOM — ADR-079. */
  const sizeOf = useCallback(
    (id: NodeId): CanvasSize | undefined => {
      const rect = latest.current.cache.get(id)
      const { zoom } = viewport.current()

      return rect === undefined
        ? undefined
        : { width: rect.width / zoom, height: rect.height / zoom }
    },
    [viewport],
  )

  const preview = useCallback(
    (id: NodeId, size: CanvasSize | null): void => {
      const element = nodeElement(id)

      if (element === null) {
        return
      }

      if (size === null) {
        element.style.removeProperty(RESIZE_VARS.width)
        element.style.removeProperty(RESIZE_VARS.height)
        element.removeAttribute('data-resizing')

        return
      }

      element.style.setProperty(RESIZE_VARS.width, `${size.width}px`)
      element.style.setProperty(RESIZE_VARS.height, `${size.height}px`)
      element.setAttribute('data-resizing', 'true')
    },
    [nodeElement],
  )

  const commit = useCallback(
    (id: NodeId, size: CanvasSize): void => {
      preview(id, null)
      latest.current.resize?.commit(id, size)
    },
    [preview],
  )

  const nudge = useCallback(
    (signs: ResizeSigns, coarse: boolean): void => {
      const id = latest.current.selectedId()
      const start = id === null ? undefined : sizeOf(id)

      // A north handle takes no horizontal arrow: committing an unchanged size would put an entry
      // in the history for a key press that did nothing.
      if (id === null || start === undefined || (signs.signX === 0 && signs.signY === 0)) {
        return
      }

      const step = coarse ? NUDGE_STEP_COARSE : NUDGE_STEP

      commit(id, resizeDraft(start, { x: step, y: step }, signs, { shift: false, alt: false }))
    },
    [commit, sizeOf],
  )

  // ADR-096: SHORTCUTS.md § Transform gives resize to `Mod+Alt`+arrows, on the canvas itself.
  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const signs = ARROW_SIGNS[event.key]

      if (signs === undefined || !(event.metaKey || event.ctrlKey) || !event.altKey) {
        return
      }

      event.preventDefault()
      nudge(signs, event.shiftKey)
    }

    root.addEventListener('keydown', onKeyDown)

    return () => {
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [nudge, rootRef])

  return useMemo<ResizeHandle>(
    () => ({
      start(event, spec) {
        const id = latest.current.selectedId()
        const start = id === null ? undefined : sizeOf(id)

        if (id === null || start === undefined) {
          return
        }

        event.preventDefault()
        // The handle owns this press. Letting it reach the root would run a hit test at a point the
        // handle covers, and a handle hanging off the node's corner would start a marquee.
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)

        const origin = { x: event.clientX, y: event.clientY }
        let draft = start

        const onMove = (move: PointerEvent): void => {
          const { zoom } = viewport.current()
          const delta = { x: (move.clientX - origin.x) / zoom, y: (move.clientY - origin.y) / zoom }

          draft = resizeDraft(start, delta, spec, { shift: move.shiftKey, alt: move.altKey })
          preview(id, draft)
        }

        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          window.removeEventListener('pointercancel', onUp)
          commit(id, draft)
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
      },

      key(event, spec) {
        const signs = ARROW_SIGNS[event.key]

        if (signs === undefined) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        nudge({ signX: signs.signX * spec.signX, signY: signs.signY * spec.signY }, event.shiftKey)
      },
    }),
    [commit, nudge, preview, sizeOf, viewport],
  )
}
