'use client'

import { type SnapCandidate, canvasRect, computeSnap } from '@motion-studio/canvas'
import { clamp } from '@motion-studio/utils'
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from 'react'

import { CARD, SNAP_THRESHOLD, STAGE, START } from './hero-stage'
import type { SlotBox } from './use-slot-box'

/** How far above and below the slot still counts as over it — half the card, in canvas units. */
const SLOT_REACH = 48

/** The right-hand strip the card starts in. A card parked there is beside the page, not on it. */
const PARK = 260

export interface Guide {
  readonly axis: 'x' | 'y'
  readonly value: number
}

/** Edges and centre of the slot, in the shape `computeSnap` takes — rebuilt when the slot moves. */
const candidatesFor = (slot: SlotBox): readonly SnapCandidate[] => [
  { axis: 'y', value: slot.top, kind: 'edge', from: 0, to: STAGE.width },
  {
    axis: 'y',
    value: slot.top + slot.height / 2,
    kind: 'center',
    centered: true,
    from: 0,
    to: STAGE.width,
  },
  { axis: 'y', value: slot.top + slot.height, kind: 'edge', from: 0, to: STAGE.width },
  { axis: 'x', value: 0, kind: 'edge', from: slot.top, to: slot.top + slot.height },
  {
    axis: 'x',
    value: STAGE.width / 2,
    kind: 'center',
    centered: true,
    from: slot.top,
    to: slot.top + slot.height,
  },
  { axis: 'x', value: STAGE.width, kind: 'edge', from: slot.top, to: slot.top + slot.height },
]

export interface CardDrag {
  /** The stage element the pointer's coordinates are read against. */
  readonly stageRef: RefObject<HTMLDivElement | null>
  readonly position: { readonly x: number; readonly y: number }
  readonly guides: readonly Guide[]
  readonly dragging: boolean
  readonly placed: boolean
  /** Over the slot and not yet dropped: the state the slot and the ghost both light up for. */
  readonly armed: boolean
  readonly onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  readonly onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  readonly onRelease: (event: ReactPointerEvent<HTMLButtonElement>) => void
  /** The keyboard path, in canvas units — SHORTCUTS.md § Transform nudges by one, ten with Shift. */
  readonly nudge: (dx: number, dy: number) => void
  readonly place: () => void
  readonly reset: () => void
}

/**
 * The gesture the first screen is for: a card dragged onto the page's empty slot.
 *
 * The snapping is `computeSnap` from `packages/canvas`, unmodified — the same function the studio
 * calls on every drag. It is a hook rather than a part of the component because the component's other
 * subject is the page being demonstrated, and the two share nothing but the slot's box.
 */
export function useCardDrag(slot: SlotBox): CardDrag {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const grab = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState(START)
  const [guides, setGuides] = useState<readonly Guide[]>([])
  const [dragging, setDragging] = useState(false)
  const [placed, setPlaced] = useState(false)

  const overSlot = useCallback(
    (x: number, y: number): boolean => {
      const centre = y + CARD.height / 2

      return (
        centre > slot.top - SLOT_REACH &&
        centre < slot.top + slot.height + SLOT_REACH &&
        x < STAGE.width - PARK
      )
    },
    [slot],
  )

  const toCanvas = useCallback((event: ReactPointerEvent): { x: number; y: number } | null => {
    const rect = stageRef.current?.getBoundingClientRect()

    if (rect === undefined || rect.width === 0) {
      return null
    }

    // The stage is laid out at STAGE.width and drawn scaled, so one client pixel is 1/scale units.
    const scale = rect.width / STAGE.width

    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale }
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    const point = toCanvas(event)

    if (point === null) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    grab.current = { x: point.x - position.x, y: point.y - position.y }
    setDragging(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (!dragging) {
      return
    }

    const point = toCanvas(event)

    if (point === null) {
      return
    }

    const raw = {
      x: clamp(point.x - grab.current.x, 0, STAGE.width - CARD.width),
      y: clamp(point.y - grab.current.y, 0, STAGE.height - CARD.height),
    }
    const snap = computeSnap(
      canvasRect({ x: raw.x, y: raw.y, width: CARD.width, height: CARD.height }),
      candidatesFor(slot),
      SNAP_THRESHOLD,
    )

    setPosition({ x: Math.round(raw.x + snap.delta.x), y: Math.round(raw.y + snap.delta.y) })
    setGuides(snap.guides.map((guide) => ({ axis: guide.axis, value: guide.value })))
  }

  const onRelease = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
    setGuides([])

    if (overSlot(position.x, position.y)) {
      setPlaced(true)
    }
  }

  const nudge = (dx: number, dy: number): void => {
    setPosition((current) => ({
      x: clamp(current.x + dx, 0, STAGE.width - CARD.width),
      y: clamp(current.y + dy, 0, STAGE.height - CARD.height),
    }))
  }

  const place = (): void => {
    if (overSlot(position.x, position.y)) {
      setPlaced(true)
    }
  }

  const reset = (): void => {
    setPlaced(false)
    setPosition(START)
  }

  return {
    stageRef,
    position,
    guides,
    dragging,
    placed,
    armed: !placed && overSlot(position.x, position.y),
    onPointerDown,
    onPointerMove,
    onRelease,
    nudge,
    place,
    reset,
  }
}
