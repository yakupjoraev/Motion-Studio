'use client'

import { NODE_ID_ATTRIBUTE, nodeIdsFromElements } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import { BREAKPOINTS, type BreakpointId } from '@motion-studio/schema'
import { type MouseEvent, type ReactElement, useCallback, useEffect, useRef } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { ComparisonFrame } from './comparison-frame'

/** RESPONSIVE_ENGINE.md § Canvas preview names these three: a phone, a tablet and a desktop. */
export const COMPARISON_FRAMES: readonly BreakpointId[] = ['base', 'md', 'xl']

/** Screen pixels between frames and around the row, subtracted before the scale is worked out. */
const GAP_PX = 24
const PADDING_PX = 24

export const FRAME_SCALE_VAR = '--ms-frame-scale'

/**
 * ADR-168. Below two thirds the smallest type a block can render — 12 px, `type.ts` § `sm` — falls
 * under 8 px and stops being text, so the frames scroll instead of shrinking further.
 */
export const MIN_FRAME_SCALE = 2 / 3

/**
 * `Mod+Shift+M`, off by default — RESPONSIVE_ENGINE.md § Canvas preview. **Three live frames is three
 * times the render cost of one**: every node is mounted three times, with its motion and its effects,
 * which is why this is a comparison tool a user turns on to look at something and not a working mode.
 *
 * The frames are read-only. Clicking one selects, because a comparison you cannot point at is a
 * screenshot; everything that changes the document — dragging, resizing, the context menu — stays on
 * the editing canvas, and the frame carrying the active breakpoint says so in its caption.
 */
export function MultiFrameView(): ReactElement {
  const rootId = useStudioStore(selectors.selectRootId)
  const active = useStudioStore((state) => state.viewport.breakpoint)
  const rowRef = useFrameScale()

  const onClick = useCallback((event: MouseEvent<HTMLElement>) => {
    const host = (event.target as HTMLElement).closest(`[${NODE_ID_ATTRIBUTE}]`)
    const [id] = host === null ? [] : nodeIdsFromElements([host])

    if (id === undefined) {
      useStudioStore.getState().clearSelection()

      return
    }

    useStudioStore.getState().select([id], 'replace')
  }, [])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: selection has its own keyboard path on the canvas and in the layers tree; this surface is a preview, and duplicating the map here would be a second answer to "what is selected"
    <div
      className="h-full w-full overflow-auto bg-canvas-bg p-6"
      data-testid="multi-frame-view"
      onClick={onClick}
      ref={rowRef}
    >
      <div className="flex h-full min-h-0 items-start gap-6">
        {COMPARISON_FRAMES.map((breakpoint) => (
          <ComparisonFrame
            breakpoint={breakpoint}
            editing={breakpoint === active}
            key={breakpoint}
            rootId={rootId}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * One scale for all three frames — a comparison in which each frame is scaled to fit its own column
 * would show three layouts at three magnifications, which is the one thing this view must not do.
 *
 * It is written as a CSS variable rather than held in state: a panel resize then moves the frames
 * without re-rendering the document three times.
 */
function useFrameScale(): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current

    if (element === null) {
      return
    }

    const total = COMPARISON_FRAMES.reduce((sum, id) => sum + BREAKPOINTS[id].frame, 0)
    const gaps = GAP_PX * (COMPARISON_FRAMES.length - 1) + PADDING_PX * 2

    const write = (): void => {
      const available = element.clientWidth - gaps

      element.style.setProperty(
        FRAME_SCALE_VAR,
        String(Math.min(1, Math.max(MIN_FRAME_SCALE, available / total))),
      )
    }

    write()

    const observer = new ResizeObserver(write)

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return ref
}
