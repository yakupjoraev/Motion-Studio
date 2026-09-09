'use client'

import { PRESETS, ThemeScope } from '@motion-studio/theme'
import type { ReactNode } from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'
import { BlockRender } from '../../gallery/block-render'
import { PreviewFrame } from '../../gallery/preview-frame'

import { useBlockProps } from '../use-block-props'
import { CARD_SURFACE, HeroCardFace, cardBox } from './hero-drag-card'
import { DRAGGED_BLOCK, DRAGGED_BLOCKS, STAGE, STAGE_PAGE } from './hero-stage'
import { HeroWindow } from './hero-window'
import { useCardDrag } from './use-card-drag'
import { useSlotBox } from './use-slot-box'

const percent = (value: number, of: number): string => `${(value / of) * 100}%`

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
  const { ref: slotRef, box: slot } = useSlotBox()
  const card = useCardDrag(slot)
  const pageProps = useBlockProps(STAGE_PAGE)
  const heroProps = useBlockProps(DRAGGED_BLOCKS)

  const ghost = card.placed ? 'opacity-100' : card.armed ? 'opacity-45' : 'opacity-[0.14] grayscale'

  return (
    <figure className="m-0 flex flex-col gap-3">
      <HeroWindow>
        {/*
          The page inside wears the shipped `studio-light` theme: a theme is a scope of CSS variables
          (THEME_ENGINE.md § Scoped themes), so the frame carries its own without touching the sheet
          around it, and a light document on a light sheet is what someone building a landing page in
          this editor would be looking at.
        */}
        <ThemeScope theme={PRESETS['studio-light']}>
          <PreviewFrame
            className="w-full overflow-hidden bg-surface-0"
            height={STAGE.height}
            testId="hero-stage"
            width={STAGE.width}
          >
            <div className="relative h-full w-full" ref={card.stageRef}>
              {/*
                The page is a picture of a page — `gallery-card.tsx` § inert. It is built out of the
                shipped components, so it carries a navbar's links, a footer's links and the hero's
                own `<h1>`: left in the tree, the first screen announces two first-level headings and
                hands a keyboard twenty tab stops inside a demonstration. The card below is not in
                here, because the card is the one thing on this stage a visitor is meant to reach.
              */}
              <div aria-hidden="true" inert>
                {pageProps === null
                  ? fallback
                  : STAGE_PAGE.map((block, index) => (
                      <div key={block.id}>
                        {/*
                        Each block stands up inside its own plan: the dashed outline first, then the
                        real component in it. The index staggers them, so the page is drawn in the
                        order it is read — `landing.css` § The page, built.
                      */}
                        <div
                          className="ms-build"
                          style={{
                            ['--ms-build-index' as string]: String(index === 0 ? 0 : index + 1),
                          }}
                        >
                          <BlockRender
                            category={block.category}
                            fallback={<span className="block h-24" />}
                            id={block.id}
                            props={pageProps[index] ?? {}}
                          />
                        </div>

                        {/* The hero's place in the page, immediately under the navbar. */}
                        {index === 0 ? (
                          <div
                            className="ms-build relative"
                            ref={slotRef}
                            style={{ ['--ms-build-index' as string]: '1' }}
                          >
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
                            {card.placed ? null : (
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute inset-2 rounded-md border border-dashed transition-colors duration-[--ms-duration-fast] ${
                                  card.armed
                                    ? 'border-accent bg-accent-muted/25'
                                    : 'border-border-strong bg-surface-0/55'
                                }`}
                              >
                                <span
                                  className={`absolute top-0 left-0 rounded-tl-md rounded-br-md px-2.5 py-1 font-mono text-[13px] uppercase tracking-[0.16em] transition-colors duration-[--ms-duration-fast] ${
                                    card.armed
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
              </div>

              {card.guides.map((guide) => (
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

              {card.placed ? null : (
                <button
                  aria-label={hero.demoBlockLabel}
                  className={`${CARD_SURFACE} ms-card-in cursor-grab touch-none active:cursor-grabbing motion-safe:transition-[left,top] motion-safe:duration-[--ms-duration-instant]`}
                  data-dragging={String(card.dragging)}
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
                      card.nudge(move[0], move[1])

                      return
                    }

                    if (event.key === 'Enter') {
                      event.preventDefault()
                      card.place()
                    }
                  }}
                  onPointerCancel={card.onRelease}
                  onPointerDown={card.onPointerDown}
                  onPointerMove={card.onPointerMove}
                  onPointerUp={card.onRelease}
                  style={cardBox(card.position.x, card.position.y)}
                  type="button"
                >
                  <HeroCardFace category={hero.demoBlockCategory} name={hero.demoBlock} />
                </button>
              )}
            </div>
          </PreviewFrame>
        </ThemeScope>
      </HeroWindow>

      <figcaption className="flex min-h-[2.6em] flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs text-foreground-muted uppercase leading-[1.3] tracking-[0.14em]">
        <span>
          {card.placed
            ? hero.demoPlaced
            : hero.demoLiveCaption
                .replace('{x}', String(card.position.x))
                .replace('{y}', String(card.position.y))}
        </span>
        {card.placed ? (
          <button
            className="rounded-sm border border-border px-2 py-0.5 uppercase tracking-[0.14em] outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
            onClick={card.reset}
            type="button"
          >
            {hero.demoUndo}
          </button>
        ) : null}
      </figcaption>
    </figure>
  )
}
