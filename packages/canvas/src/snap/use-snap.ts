'use client'

import { type RefObject, createContext, useContext, useEffect, useMemo, useRef } from 'react'

import type { CanvasRect } from '../coords/index'
import type { ViewportHandle } from '../viewport/use-viewport'

import { computeSnap } from './compute-snap'
import { generateSnapCandidates } from './generate-candidates'
import { type SnapGapSlot, type SnapOverlay, clearSnap, paintSnap } from './guides/paint-guides'
import { GAP_LABEL_SLOTS, THRESHOLD_PX } from './snap.constants'
import type { SnapCandidate, SnapCandidateInput, SnapResult } from './snap.types'

const NOTHING: SnapResult = { delta: { x: 0, y: 0 }, guides: [] }

/** What `begin` reads the modifier off — a pointer event satisfies it, and so does a fake. */
export interface ModifierState {
  readonly metaKey: boolean
  readonly ctrlKey: boolean
}

export interface SnapHookOptions {
  readonly viewport: ViewportHandle
  /** Screen pixels. The store's `viewport.guides.snapThreshold` overrides the default of 4. */
  readonly thresholdPx?: number | undefined
  /** Turns the engine off entirely — `viewport.guides.enabled` in the store. */
  readonly enabled?: boolean | undefined
}

export interface SnapHandle {
  readonly overlay: SnapOverlay
  /** Freezes the candidates for the gesture — CANVAS.md § Performance. */
  begin(input: SnapCandidateInput, modifiers?: ModifierState): void
  /** Resolves the live box and paints the guides. Returns the delta the caller applies. */
  move(moving: CanvasRect): SnapResult
  end(): void
}

/**
 * ADR-089. The session between `begin` and `end`: candidates computed once, the modifier read live,
 * and one `rAF` per frame that writes the overlay. React renders nothing during a drag.
 */
export function useSnap({ viewport, thresholdPx, enabled }: SnapHookOptions): SnapHandle {
  const lineX = useRef<HTMLDivElement | null>(null)
  const lineY = useRef<HTMLDivElement | null>(null)
  const slots = useSlots()
  const session = useRef<{
    candidates: readonly SnapCandidate[]
    moving: CanvasRect | null
    disabled: boolean
    frame: number | null
    result: SnapResult
  }>({ candidates: [], moving: null, disabled: false, frame: null, result: NOTHING })
  const settings = useRef({ thresholdPx, enabled })

  settings.current = { thresholdPx, enabled }

  const overlay = useMemo<SnapOverlay>(
    () => ({ lines: { x: lineX, y: lineY }, gaps: slots }),
    [slots],
  )

  // Cancelling a pending frame on unmount, so a drag that ends by navigation leaves no callback
  // holding a detached element.
  useEffect(
    () => () => {
      if (session.current.frame !== null) {
        cancelAnimationFrame(session.current.frame)
        session.current.frame = null
      }
    },
    [],
  )

  return useMemo<SnapHandle>(() => {
    const paint = (): void => {
      session.current.frame = null
      paintSnap(overlay, session.current.result, viewport.current())
    }

    const schedule = (): void => {
      if (session.current.frame === null) {
        session.current.frame = requestAnimationFrame(paint)
      }
    }

    const resolve = (moving: CanvasRect): SnapResult => {
      const { thresholdPx: px, enabled: on } = settings.current
      const { zoom } = viewport.current()
      // The 4 screen px of CANVAS.md § Snapping, in canvas units — the conversion that makes the
      // snap engage at the same distance under the cursor at 25 % and at 400 %.
      const threshold = session.current.disabled || on === false ? 0 : (px ?? THRESHOLD_PX) / zoom

      return computeSnap(moving, session.current.candidates, threshold)
    }

    // Live, because a user presses `Cmd` when a snap is fighting them and the pointer may not move
    // again before they expect the guides to go — CANVAS.md § Snapping.
    const onModifier = (event: KeyboardEvent): void => {
      const disabled = event.metaKey || event.ctrlKey

      if (disabled === session.current.disabled || session.current.moving === null) {
        return
      }

      session.current.disabled = disabled
      session.current.result = resolve(session.current.moving)
      schedule()
    }

    const listen = (add: boolean): void => {
      const method = add ? window.addEventListener : window.removeEventListener

      method('keydown', onModifier as EventListener)
      method('keyup', onModifier as EventListener)
    }

    return {
      overlay,

      begin(input, modifiers) {
        session.current.candidates = generateSnapCandidates(input)
        session.current.moving = input.moving
        session.current.disabled = modifiers?.metaKey === true || modifiers?.ctrlKey === true
        listen(true)
      },

      move(moving) {
        session.current.moving = moving
        session.current.result = resolve(moving)
        schedule()

        return session.current.result
      },

      end() {
        listen(false)

        if (session.current.frame !== null) {
          cancelAnimationFrame(session.current.frame)
          session.current.frame = null
        }

        session.current.candidates = []
        session.current.moving = null
        session.current.result = NOTHING
        clearSnap(overlay)
      },
    }
  }, [overlay, viewport])
}

/**
 * The drag layer that will call this lives inside `renderNode`, which is code the canvas does not
 * own — the same reason the rect cache is reached through context rather than a prop.
 */
export const SnapContext = createContext<SnapHandle | null>(null)

export function useSnapContext(): SnapHandle {
  const snap = useContext(SnapContext)

  if (snap === null) {
    throw new Error('useSnapContext must be used inside the Canvas')
  }

  return snap
}

/** A fixed pool: at most one snap per axis, so at most two gaps per axis to label. */
function useSlots(): readonly SnapGapSlot[] {
  const bars = useRef<RefObject<HTMLDivElement | null>[]>([])
  const labels = useRef<RefObject<HTMLSpanElement | null>[]>([])

  return useMemo(() => {
    const slots: SnapGapSlot[] = []

    for (let index = 0; index < GAP_LABEL_SLOTS; index += 1) {
      const bar = bars.current[index] ?? { current: null }
      const label = labels.current[index] ?? { current: null }

      bars.current[index] = bar
      labels.current[index] = label
      slots.push({ id: `gap-${index}`, bar, label })
    }

    return slots
  }, [])
}
