import type { CSSProperties } from 'react'

import { effectVars } from '../effect-vars'

import type { BorderBeamProps } from './border-beam.types'

/**
 * Border beam.
 *
 * Technique: **one** rotating conic gradient behind a mask that keeps only the border band. The mask
 * is two identical fills clipped to different boxes — content-box and border-box — composited with
 * `exclude`, which leaves exactly the padding ring and nothing else. The cone sits on a square
 * larger than the element's diagonal so no corner is ever outside it.
 *
 * Four animated edges is the obvious alternative and it is wrong twice: four elements instead of
 * one, and four corners where the light has to hand over, which never quite line up on a rounded
 * box. `border-radius: inherit` means this follows whatever radius the node already has.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */
export function BorderBeam({ tint, intensity, speed, borderWidth, arc }: BorderBeamProps) {
  const style = {
    ...effectVars({ tint, intensity, speed }),
    '--ms-fx-line': `${borderWidth}px`,
    '--ms-fx-arc': `${arc}deg`,
  } as CSSProperties

  return (
    <div
      aria-hidden
      className="pointer-events-none ms-fx ms-fx-border-beam overflow-hidden"
      data-testid="border-beam"
      style={style}
    >
      <span className="ms-fx-border-beam-ring" data-testid="border-beam-ring" />
    </div>
  )
}
