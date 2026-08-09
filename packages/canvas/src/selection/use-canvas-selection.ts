'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, startTransition, useEffect, useRef } from 'react'

import type { CanvasScene, CanvasSelectionPort, SelectionMode } from '../canvas.types'
import { screenPoint } from '../coords/index'
import { type HitContext, hitTest } from '../hit/hit-test'
import type { MarqueeHandle } from '../hit/use-marquee'

import { describeEnter, describeSelection } from './selection-announcer'

/** The primary button. The middle one pans, and `usePan` owns it. */
const PRIMARY_BUTTON = 0

/**
 * A control in the overlay layer — a resize handle, a user guide — owns its own press. React's
 * `stopPropagation` cannot say so: these listeners are native and on the canvas root, which the
 * event passes on its way up to React's own container, so the guard has to be here.
 */
const OVERLAY_CONTROL = '[data-overlay-control]'

const onOverlayControl = (event: Event): boolean =>
  event.target instanceof Element && event.target.closest(OVERLAY_CONTROL) !== null

/** SHORTCUTS.md § Selection: `Shift` adds, `Mod` toggles, a bare click replaces. */
function modeFor(event: PointerEvent): SelectionMode {
  if (event.shiftKey) {
    return 'add'
  }

  return event.metaKey || event.ctrlKey ? 'toggle' : 'replace'
}

export interface CanvasSelectionHookOptions {
  readonly rootRef: RefObject<HTMLElement | null>
  readonly rootId: NodeId
  readonly scene: CanvasScene
  readonly selection: CanvasSelectionPort
  readonly marquee: MarqueeHandle
  readonly announce: (message: string) => void
}

/**
 * Pointer selection: one hit test per press, and the press that hits nothing hands the gesture to the
 * marquee. Selecting on `pointerdown` rather than `click` is what makes press-and-drag a continuous
 * gesture later, when dragging a node moves it.
 */
export function useCanvasSelection({
  rootRef,
  rootId,
  scene,
  selection,
  marquee,
  announce,
}: CanvasSelectionHookOptions): void {
  const latest = useRef({ rootId, scene, selection, marquee, announce })

  latest.current = { rootId, scene, selection, marquee, announce }

  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const contextAt = (isolationId: NodeId | null): HitContext => ({
      rootId: latest.current.rootId,
      isolationId,
      node: (id) => latest.current.scene.node(id),
    })

    const onPointerDown = (event: PointerEvent): void => {
      // Held space is a pan, whatever is under the cursor.
      if (
        event.button !== PRIMARY_BUTTON ||
        root.dataset['panMode'] === 'true' ||
        onOverlayControl(event)
      ) {
        return
      }

      const {
        scene: current,
        selection: port,
        announce: say,
        rootId: documentRootId,
      } = latest.current
      const point = screenPoint(event.clientX, event.clientY)
      const hit = hitTest(point, contextAt(current.isolationId()), { deep: event.altKey })

      if (hit === null) {
        startTransition(() => {
          port.clear()
          say(describeSelection(current, documentRootId))
        })
        latest.current.marquee.begin(event)

        return
      }

      startTransition(() => {
        port.select([hit], modeFor(event))
        say(describeSelection(current, documentRootId))
      })
    }

    /**
     * Entering is the second half of CANVAS.md § Hit testing: the first click selects the container,
     * and the second enters it and takes whatever is under the cursor inside.
     */
    const onDoubleClick = (event: MouseEvent): void => {
      const {
        scene: current,
        selection: port,
        announce: say,
        rootId: documentRootId,
      } = latest.current
      const point = screenPoint(event.clientX, event.clientY)
      const container = hitTest(point, contextAt(current.isolationId()))

      if (container === null || (current.node(container)?.children.length ?? 0) === 0) {
        return
      }

      startTransition(() => {
        port.enter(container)

        const child = hitTest(point, contextAt(container))

        if (child !== null) {
          port.select([child], 'replace')
        }

        say(`${describeEnter(current, container)} ${describeSelection(current, documentRootId)}`)
      })
    }

    /**
     * A right-click acts on what it points at, so the menu that follows describes the node under the
     * cursor. An already-selected node keeps the whole set: right-clicking one of five to Duplicate
     * should duplicate five.
     */
    const onContextMenu = (event: MouseEvent): void => {
      const {
        scene: current,
        selection: port,
        announce: say,
        rootId: documentRootId,
      } = latest.current
      const hit = hitTest(
        screenPoint(event.clientX, event.clientY),
        contextAt(current.isolationId()),
      )

      if (hit === null || current.selectedIds().includes(hit)) {
        return
      }

      startTransition(() => {
        port.select([hit], 'replace')
        say(describeSelection(current, documentRootId))
      })
    }

    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('dblclick', onDoubleClick)
    root.addEventListener('contextmenu', onContextMenu)

    return () => {
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('dblclick', onDoubleClick)
      root.removeEventListener('contextmenu', onContextMenu)
    }
  }, [rootRef])
}
