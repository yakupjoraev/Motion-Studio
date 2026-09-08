'use client'

import { type SnapCandidate, canvasRect, computeSnap } from '@motion-studio/canvas'
import { clamp } from '@motion-studio/utils'
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'
import { BlockRender } from '../../gallery/block-render'
import { PreviewFrame } from '../../gallery/preview-frame'

import { CARD_SURFACE, HeroCardFace, cardBox } from './hero-drag-card'
import {
  CARD,
  DRAGGED_BLOCK,
  DRAGGED_BLOCKS,
  SNAP_THRESHOLD,
  STAGE,
  STAGE_PAGE,
  START,
} from './hero-stage'
import { HeroWindow } from './hero-window'
import { useSlotBox } from './use-slot-box'
import { useStageProps } from './use-stage-props'

const percent = (value: number, of: number): string => `${(value / of) * 100}%`

/** Edges and centre of the slot, in the shape `computeSnap` takes — rebuilt when the slot moves. */
const candidatesFor = (slot: { top: number; height: number }): readonly SnapCandidate[] => [
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

export interface HeroPagePreviewProps {
  /** Held until the page's own props land, so the frame never paints half a page. */
  readonly fallback: ReactNode
}

/**
 * The product's first gesture, on the product's own output.
 *
 * The page under the card is three blocks out of the shipped registry, rendered by the shipped
 * components — `navbar`, `feature-grid`, `footer` — with the hero standing in it as a ghost. The card
 * is that hero. Drag it over the ghost and the ghost comes up to full strength; drop it and the page
 * has a hero, laid out by the block's own component at 1280 px.
 *
 * The snapping is `computeSnap` from `packages/canvas`, unmodified: the same function the studio
 * calls on every drag. Nothing here is a mock of the product — VISION.md § The problem is precisely
 * that every other catalogue shows a picture of something you cannot touch.
 */
export function HeroPagePreview({ fallback }: HeroPagePreviewProps) {
  const { hero } = useLanding()
  const stage = useRef<HTMLDivElement | null>(null)
  const grab = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState(START)
  const [guides, setGuides] = useState<readonly { axis: 'x' | 'y'; value: number }[]>([])
  const [dragging, setDragging] = useState(false)
  const [placed, setPlaced] = useState(false)
  const { ref: slotRef, box: slot } = useSlotBox()
  const pageProps = useStageProps(STAGE_PAGE)
  const heroProps = useStageProps(DRAGGED_BLOCKS)

  const overSlot = useCallback(
    (x: number, y: number): boolean => {
      const centre = y + CARD.height / 2

      return centre > slot.top - 48 && centre < slot.top + slot.height + 48 && x < STAGE.width - 260
    },
    [slot],
  )

  const toCanvas = useCallback((event: ReactPointerEvent): { x: number; y: number } | null => {
    const rect = stage.current?.getBoundingClientRect()

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

  const release = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
    setGuides([])

    if (overSlot(position.x, position.y)) {
      setPlaced(true)
    }
  }

  /** The keyboard path, in canvas units — SHORTCUTS.md § Transform nudges by one, ten with Shift. */
  const nudge = (dx: number, dy: number): void => {
    setPosition((current) => ({
      x: clamp(current.x + dx, 0, STAGE.width - CARD.width),
      y: clamp(current.y + dy, 0, STAGE.height - CARD.height),
    }))
  }

  const armed = !placed && overSlot(position.x, position.y)
  const ghost = placed ? 'opacity-100' : armed ? 'opacity-45' : 'opacity-[0.14] grayscale'

  return (
    <figure className="m-0 flex flex-col gap-3">
      <HeroWindow>
        <PreviewFrame
          className="w-full overflow-hidden bg-surface-0"
          height={STAGE.height}
          testId="hero-stage"
          width={STAGE.width}
        >
          <div className="relative h-full w-full" ref={stage}>
            {pageProps === null
              ? fallback
              : STAGE_PAGE.map((block, index) => (
                  <div key={block.id}>
                    <BlockRender
                      category={block.category}
                      fallback={<span className="block h-24" />}
                      id={block.id}
                      props={pageProps[index] ?? {}}
                    />

                    {/* The hero's place in the page, immediately under the navbar. */}
                    {index === 0 ? (
                      <div className="relative" ref={slotRef}>
                        <div
                          className={`transition-opacity duration-[--ms-duration-base] ease-[--ms-ease-standard] ${ghost}`}
                        >
                          {heroProps === null ? (
                            <span className="block h-[420px]" />
                          ) : (
                            <BlockRender
                              category={DRAGGED_BLOCK.category}
                              fallback={<span className="block h-[420px]" />}
                              id={DRAGGED_BLOCK.id}
                              props={heroProps[0] ?? {}}
                            />
                          )}
                        </div>

                        {/*
                          The empty slot wears the canvas's own marks rather than a caption: a dashed
                          outline and a node chip at its top-left, exactly where the studio draws the
                          name of the thing under the pointer. Armed, both take the accent.
                        */}
                        {placed ? null : (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-2 rounded-md border border-dashed transition-colors duration-[--ms-duration-fast] ${
                              armed
                                ? 'border-accent bg-accent-muted/25'
                                : 'border-border-strong bg-surface-0/55'
                            }`}
                          >
                            <span
                              className={`absolute top-0 left-0 rounded-tl-md rounded-br-md px-2.5 py-1 font-mono text-[13px] uppercase tracking-[0.16em] transition-colors duration-[--ms-duration-fast] ${
                                armed
                                  ? 'bg-accent text-foreground-onAccent'
                                  : 'bg-surface-2 text-foreground-muted'
                              }`}
                            >
                              {hero.demoSlot}
                            </span>
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}

            {guides.map((guide) => (
              <span
                aria-hidden="true"
                className="absolute z-30 bg-canvas-guide"
                key={`${guide.axis}-${guide.value}`}
                style={
                  guide.axis === 'x'
                    ? { left: percent(guide.value, STAGE.width), top: 0, bottom: 0, width: 2 }
                    : { top: percent(guide.value, STAGE.height), left: 0, right: 0, height: 2 }
                }
              />
            ))}

            {placed ? null : (
              <button
                aria-label={hero.demoBlockLabel}
                className={`${CARD_SURFACE} cursor-grab touch-none active:cursor-grabbing motion-safe:transition-[left,top] motion-safe:duration-[--ms-duration-instant]`}
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

                    return
                  }

                  if (event.key === 'Enter' && overSlot(position.x, position.y)) {
                    event.preventDefault()
                    setPlaced(true)
                  }
                }}
                onPointerCancel={release}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={release}
                style={cardBox(position.x, position.y)}
                type="button"
              >
                <HeroCardFace category={hero.demoBlockCategory} name={hero.demoBlock} />
              </button>
            )}
          </div>
        </PreviewFrame>
      </HeroWindow>

      <figcaption className="flex min-h-[2.6em] flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs text-foreground-muted uppercase leading-[1.3] tracking-[0.14em]">
        <span>
          {placed
            ? hero.demoPlaced
            : hero.demoLiveCaption
                .replace('{x}', String(position.x))
                .replace('{y}', String(position.y))}
        </span>
        {placed ? (
          <button
            className="rounded-sm border border-border px-2 py-0.5 uppercase tracking-[0.14em] outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
            onClick={() => {
              setPlaced(false)
              setPosition(START)
            }}
            type="button"
          >
            {hero.demoUndo}
          </button>
        ) : null}
      </figcaption>
    </figure>
  )
}
