'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, startTransition, useEffect, useRef } from 'react'

import type { CanvasScene, CanvasSelectionPort } from '../canvas.types'
import type { ViewportHandle } from '../viewport/use-viewport'

import { describeEnter, describeExit, describeSelection } from './selection-announcer'

/** SHORTCUTS.md § Transform. `Alt` takes the grid size, which the artboard is already drawn with. */
export const NUDGE_STEP = 1
export const NUDGE_STEP_COARSE = 10

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

export function arrowStep(event: KeyboardEvent, gridSize: number): number {
  if (event.altKey) {
    return gridSize
  }

  return event.shiftKey ? NUDGE_STEP_COARSE : NUDGE_STEP
}

export interface KeyboardSelectionHookOptions {
  readonly rootRef: RefObject<HTMLElement | null>
  readonly rootId: NodeId
  readonly scene: CanvasScene
  readonly selection: CanvasSelectionPort
  readonly viewport: ViewportHandle
  readonly gridSize: number
  readonly announce: (message: string) => void
}

/**
 * CANVAS.md § Keyboard operation and SHORTCUTS.md § Selection, on the element that carries
 * `role="application"`. That role is what makes this hook load-bearing rather than a convenience: it
 * tells a screen reader to stop interpreting keys and hand them here, so removing these handlers
 * would leave the canvas both un-navigable and lying about it. The two travel together.
 */
export function useKeyboardSelection({
  rootRef,
  rootId,
  scene,
  selection,
  viewport,
  gridSize,
  announce,
}: KeyboardSelectionHookOptions): void {
  const latest = useRef({ rootId, scene, selection, gridSize, announce })

  latest.current = { rootId, scene, selection, gridSize, announce }

  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const levelId = (): NodeId => latest.current.scene.isolationId() ?? latest.current.rootId

    const currentId = (): NodeId | null => latest.current.scene.selectedIds()[0] ?? null

    const siblingsOf = (id: NodeId): readonly NodeId[] => {
      const { scene: current } = latest.current
      const parentId = current.node(id)?.parentId ?? latest.current.rootId

      return current.node(parentId)?.children ?? []
    }

    const selectAndSay = (ids: readonly NodeId[]): void => {
      const {
        selection: port,
        scene: current,
        announce: say,
        rootId: documentRootId,
      } = latest.current

      startTransition(() => {
        port.select(ids, 'replace')
        say(describeSelection(current, documentRootId))
      })
    }

    /** `Tab` wraps, per EDITOR_ENGINE.md § Keyboard navigation, so the level is a ring. */
    const step = (delta: number): void => {
      const from = currentId()
      const siblings =
        from === null ? (latest.current.scene.node(levelId())?.children ?? []) : siblingsOf(from)

      if (siblings.length === 0) {
        return
      }

      const index = from === null ? -1 : siblings.indexOf(from)
      const next = siblings[(index + delta + siblings.length) % siblings.length]

      if (next !== undefined) {
        selectAndSay([next])
      }
    }

    const enter = (): void => {
      const {
        scene: current,
        selection: port,
        announce: say,
        rootId: documentRootId,
      } = latest.current
      const id = currentId()

      if (id === null || (current.node(id)?.children.length ?? 0) === 0) {
        return
      }

      startTransition(() => {
        port.enter(id)

        const first = current.node(id)?.children[0]

        if (first !== undefined) {
          port.select([first], 'replace')
        }

        say(`${describeEnter(current, id)} ${describeSelection(current, documentRootId)}`)
      })
    }

    /** `Mod+Shift+A` — deselect, and only that: it does not leave the container the way `Esc` does. */
    const deselect = (): void => {
      const {
        scene: current,
        selection: port,
        announce: say,
        rootId: documentRootId,
      } = latest.current

      startTransition(() => {
        port.clear()
        say(describeSelection(current, documentRootId))
      })
    }

    /** SHORTCUTS.md § Global: one `Esc` leaves the container, the next clears the selection. */
    const leaveLevel = (): void => {
      const {
        scene: current,
        selection: port,
        announce: say,
        rootId: documentRootId,
      } = latest.current
      const isolationId = current.isolationId()

      startTransition(() => {
        if (isolationId !== null) {
          port.exit()
          say(describeExit(current, isolationId))

          return
        }

        port.clear()
        say(describeSelection(current, documentRootId))
      })
    }

    /** `Mod+Shift+↑` / `↓` — SHORTCUTS.md § Selection. The root is a level, not a selectable node. */
    const selectRelative = (toParent: boolean): void => {
      const { scene: current } = latest.current
      const id = currentId()

      if (id === null) {
        return
      }

      const parentId = current.node(id)?.parentId ?? null
      const target = toParent
        ? parentId === null || parentId === latest.current.rootId
          ? undefined
          : parentId
        : current.node(id)?.children[0]

      if (target !== undefined) {
        selectAndSay([target])
      }
    }

    const arrows = (event: KeyboardEvent, direction: readonly [number, number]): void => {
      const distance = arrowStep(event, latest.current.gridSize)
      const [dx, dy] = direction

      // Held space is pan mode — CANVAS.md § Keyboard operation — and the arrows pan with it, on the
      // same step table so the canvas introduces no number of its own (ADR-082).
      if (root.dataset['panMode'] === 'true') {
        viewport.panBy(-dx * distance, -dy * distance)
        viewport.commit()

        return
      }

      latest.current.selection.nudge(dx * distance, dy * distance)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const mod = event.metaKey || event.ctrlKey
      const direction = ARROWS[event.key]

      if (mod && event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault()
        selectRelative(event.key === 'ArrowUp')

        return
      }

      if (mod && event.key.toLowerCase() === 'a') {
        event.preventDefault()

        if (event.shiftKey) {
          deselect()

          return
        }

        selectAndSay(latest.current.scene.node(levelId())?.children ?? [])

        return
      }

      if (direction !== undefined) {
        event.preventDefault()
        arrows(event, direction)

        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        step(event.shiftKey ? -1 : 1)

        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        enter()

        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        leaveLevel()
      }
    }

    root.addEventListener('keydown', onKeyDown)

    return () => {
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [rootRef, viewport])
}
