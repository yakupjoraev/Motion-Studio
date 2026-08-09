'use client'

import { SNAP_LINE_CLASS } from '../snap.styles'

import { SNAP_VARS, type SnapOverlay } from './paint-guides'

export interface SnapGuidesProps {
  readonly overlay: SnapOverlay
}

const pos = `var(${SNAP_VARS.pos}, 0px)`
const start = `var(${SNAP_VARS.start}, 0px)`
const size = `var(${SNAP_VARS.size}, 0px)`

/**
 * Two lines, one per axis, drawn in screen space so a 1 px guide stays 1 px at 400 % zoom —
 * CANVAS.md § DOM structure. They exist from mount and are shown by `data-active`, because at most
 * one snap engages per axis and creating the element on that frame would be a render mid-gesture.
 */
export function SnapGuides({ overlay }: SnapGuidesProps) {
  return (
    <>
      <div
        aria-hidden
        className={SNAP_LINE_CLASS}
        data-axis="x"
        data-testid="snap-guide-x"
        ref={overlay.lines.x}
        style={{ left: pos, top: start, height: size, width: '1px' }}
      />
      <div
        aria-hidden
        className={SNAP_LINE_CLASS}
        data-axis="y"
        data-testid="snap-guide-y"
        ref={overlay.lines.y}
        style={{ top: pos, left: start, width: size, height: '1px' }}
      />
    </>
  )
}
