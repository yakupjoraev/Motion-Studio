import type { CSSProperties, ReactNode } from 'react'

export interface PreviewFrameProps {
  /** The width the block is rendered at, in CSS pixels — a breakpoint frame, not the card's width. */
  readonly width: number
  /** The stage's height. The frame keeps this ratio whatever width it is given. */
  readonly height: number
  readonly children: ReactNode
  readonly className?: string
  readonly testId?: string
}

/**
 * A block rendered at a real width, then scaled to whatever room it is given.
 *
 * The scale is `calc(100cqw / <width>px)` — a length over a length, which is a number, which is what
 * `scale()` takes. Written without the `px` it is a length, `scale()` rejects it, and the block
 * renders at full size inside a card a third of its width. The unit is the whole trick: the browser
 * does the arithmetic and no JavaScript measures anything. That matters twice: a card grid with 72 of these would otherwise run
 * 72 resize observers, and a measured scale cannot be right on the server, so every preview would
 * paint once at the wrong size and shift.
 *
 * The width is a *breakpoint*, not a guess: a block laid out at 375 px is a different component from
 * the same block at 1280 px, and showing the second scaled down is the only honest way to show it
 * small.
 */
export function PreviewFrame({ width, height, children, className, testId }: PreviewFrameProps) {
  /*
   * `overflow: hidden` belongs to the element that has the aspect ratio, not to a wrapper around it.
   * A transform does not change layout, so the stage still occupies its full unscaled height: put the
   * clip one level out and the parent grows to 800 px to hold a box drawn at 500.
   */
  const frame: CSSProperties = {
    containerType: 'inline-size',
    aspectRatio: `${width} / ${height}`,
    overflow: 'hidden',
  }

  /*
   * `min(1, …)`: the frame scales a stage **down** to fit and never up. A block laid out at 375 px is
   * a block on a phone, and blowing it up to fill a desktop card would show a phone layout at 2.15×
   * — the type enormous, three words visible, and nothing about it true.
   */
  const stage: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    transform: `scale(min(1, calc(100cqw / ${width}px)))`,
    transformOrigin: 'top center',
  }

  return (
    <div className={className} data-testid={testId} style={frame}>
      {/*
        Centred, so a stage narrower than its frame sits in the middle rather than against an edge.
        `shrink-0` on the stage because a flex item wider than its line shrinks by default, and a
        1280 px stage squeezed to 806 by flexbox is a breakpoint the visitor did not pick.
      */}
      <div className="flex justify-center">
        <div className="shrink-0" style={stage}>
          {children}
        </div>
      </div>
    </div>
  )
}
