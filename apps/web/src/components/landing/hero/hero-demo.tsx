'use client'

import { type CanvasRect, type SnapCandidate, canvasRect, computeSnap } from '@motion-studio/canvas'
import { clamp } from '@motion-studio/utils'
import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'

import { CARD, DEMO, DemoFrame, FIXED, START, cardClass } from './hero-demo-frame'

/** CANVAS.md § Snapping. The studio's default; the demo has no reason to be more forgiving. */
const THRESHOLD = 8

const boxOf = (x: number, y: number): CanvasRect =>
  canvasRect({ x, y, width: CARD.width, height: CARD.height })

/**
 * Edges and centres of the two fixed cards, in the shape `computeSnap` takes. Built once: the two
 * siblings do not move, which is the entire reason this demo can be this small.
 */
const CANDIDATES: readonly SnapCandidate[] = FIXED.flatMap((card) => [
  {
    axis: 'x' as const,
    value: card.x,
    kind: 'edge' as const,
    from: card.y,
    to: card.y + CARD.height,
  },
  {
    axis: 'x' as const,
    value: card.x + CARD.width / 2,
    kind: 'center' as const,
    centered: true,
    from: card.y,
    to: card.y + CARD.height,
  },
  {
    axis: 'x' as const,
    value: card.x + CARD.width,
    kind: 'edge' as const,
    from: card.y,
    to: card.y + CARD.height,
  },
  {
    axis: 'y' as const,
    value: card.y,
    kind: 'edge' as const,
    from: card.x,
    to: card.x + CARD.width,
  },
  {
    axis: 'y' as const,
    value: card.y + CARD.height / 2,
    kind: 'center' as const,
    centered: true,
    from: card.x,
    to: card.x + CARD.width,
  },
  {
    axis: 'y' as const,
    value: card.y + CARD.height,
    kind: 'edge' as const,
    from: card.x,
    to: card.x + CARD.width,
  },
])

const percent = (value: number, of: number): string => `${(value / of) * 100}%`

/**
 * The product, in one gesture — `prompts/51`: "a real canvas node the visitor can drag ... not a
 * video, not a GIF."
 *
 * The snapping is `computeSnap` from `packages/canvas`, unmodified: the same function the studio
 * calls on every drag, given two fixed siblings instead of a document. That is what makes the demo
 * honest rather than a mock of one, and it is why it fits in a landing page's budget — the engine is
 * pure, so the island is a pointer handler and two divs.
 *
 * Reduced motion removes the transition on release, not the interaction. A drag is direct
 * manipulation, not animation; taking the control away from a visitor who asked for less movement
 * would be a worse page, not a safer one — ADR-294.
 */
export function HeroDemo() {
  const surface = useRef<HTMLDivElement | null>(null)
  const grab = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState(START)
  const [guides, setGuides] = useState<readonly { axis: 'x' | 'y'; value: number }[]>([])
  const [dragging, setDragging] = useState(false)

  const toCanvas = (event: ReactPointerEvent): { x: number; y: number } | null => {
    const rect = surface.current?.getBoundingClientRect()

    if (rect === undefined || rect.width === 0) {
      return null
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * DEMO.width,
      y: ((event.clientY - rect.top) / rect.height) * DEMO.height,
    }
  }

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
      x: clamp(point.x - grab.current.x, 0, DEMO.width - CARD.width),
      y: clamp(point.y - grab.current.y, 0, DEMO.height - CARD.height),
    }
    const snap = computeSnap(boxOf(raw.x, raw.y), CANDIDATES, THRESHOLD)

    setPosition({ x: Math.round(raw.x + snap.delta.x), y: Math.round(raw.y + snap.delta.y) })
    setGuides(snap.guides.map((guide) => ({ axis: guide.axis, value: guide.value })))
  }

  const release = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
    setGuides([])
  }

  /** The keyboard path, in canvas units — SHORTCUTS.md § Transform uses the same one-pixel nudge. */
  const nudge = (dx: number, dy: number): void => {
    setPosition((current) => ({
      x: clamp(current.x + dx, 0, DEMO.width - CARD.width),
      y: clamp(current.y + dy, 0, DEMO.height - CARD.height),
    }))
  }

  return (
    <DemoFrame caption={`x ${position.x}  ·  y ${position.y}  ·  snapping to siblings`}>
      <div className="absolute inset-0" ref={surface}>
        {guides.map((guide) => (
          <span
            aria-hidden="true"
            className="absolute bg-canvas-snap"
            key={`${guide.axis}-${guide.value}`}
            style={
              guide.axis === 'x'
                ? { left: percent(guide.value, DEMO.width), top: 0, bottom: 0, width: 1 }
                : { top: percent(guide.value, DEMO.height), left: 0, right: 0, height: 1 }
            }
          />
        ))}

        <button
          aria-label="Hero block. Drag it, or move it with the arrow keys."
          className={`${cardClass} cursor-grab touch-none border-accent bg-accent-muted text-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--ms-color-foreground)_16%,transparent),0_0_28px_-6px_var(--ms-color-accent)] outline-none focus-visible:shadow-focus active:cursor-grabbing motion-safe:transition-[left,top] motion-safe:duration-[--ms-duration-instant]`}
          data-dragging={String(dragging)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 1
            const moves: Readonly<Record<string, readonly [number, number]>> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            }
            const move = moves[event.key]

            if (move !== undefined) {
              event.preventDefault()
              nudge(move[0], move[1])
            }
          }}
          onPointerCancel={release}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          style={{
            left: percent(position.x, DEMO.width),
            top: percent(position.y, DEMO.height),
            width: percent(CARD.width, DEMO.width),
            height: percent(CARD.height, DEMO.height),
          }}
          type="button"
        >
          Hero
        </button>
      </div>
    </DemoFrame>
  )
}
