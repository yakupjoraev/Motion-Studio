import { approxEqual } from '@motion-studio/utils'

import { type CanvasRect, canvasRect } from '../coords/index'

import { type AxisView, EDGES, axisView, edgeValue } from './axis'
import { PRIORITY } from './snap.constants'
import type { SnapAxis, SnapCandidate, SnapGap, SnapGuide, SnapResult } from './snap.types'

interface Match {
  /** What to add to the moving box on this axis. */
  readonly delta: number
  readonly distance: number
  readonly candidate: SnapCandidate
}

const EMPTY: SnapResult = { delta: { x: 0, y: 0 }, guides: [] }

/**
 * CANVAS.md § Snapping. Pure, per axis, and the two axes are independent: a box may snap
 * horizontally to a sibling and vertically to nothing.
 *
 * `threshold` arrives in **canvas units** — the caller divides the 4 screen px by the zoom, which is
 * what makes the snap engage at the same distance under the cursor at every zoom level.
 */
export function computeSnap(
  moving: CanvasRect,
  candidates: readonly SnapCandidate[],
  threshold: number,
): SnapResult {
  if (threshold <= 0 || candidates.length === 0) {
    return EMPTY
  }

  const x = resolveAxis(moving, candidates, threshold, 'x')
  const y = resolveAxis(moving, candidates, threshold, 'y')

  if (x === null && y === null) {
    return EMPTY
  }

  const delta = { x: x?.delta ?? 0, y: y?.delta ?? 0 }
  const moved = canvasRect({ ...moving, x: moving.x + delta.x, y: moving.y + delta.y })
  const guides: SnapGuide[] = []

  for (const [axis, match] of [
    ['x', x],
    ['y', y],
  ] as const) {
    if (match !== null) {
      guides.push(guideFor(match, candidates, axisView(moved, axis), axis))
    }
  }

  return { delta, guides }
}

/** Nearest wins; equal distances break by priority — `guide > center > edge > spacing > grid`. */
function resolveAxis(
  moving: CanvasRect,
  candidates: readonly SnapCandidate[],
  threshold: number,
  axis: SnapAxis,
): Match | null {
  const view = axisView(moving, axis)
  let best: Match | null = null

  for (const candidate of candidates) {
    if (candidate.axis !== axis) {
      continue
    }

    // ADR-083: a candidate that names an edge is offered to that one only.
    for (const edge of candidate.edge === undefined ? EDGES : [candidate.edge]) {
      const delta = candidate.value - edgeValue(view, edge)
      const distance = Math.abs(delta)

      if (distance <= threshold && (best === null || beats(candidate, distance, best))) {
        best = { delta, distance, candidate }
      }
    }
  }

  return best
}

function beats(candidate: SnapCandidate, distance: number, current: Match): boolean {
  if (approxEqual(distance, current.distance)) {
    return PRIORITY[candidate.kind] > PRIORITY[current.candidate.kind]
  }

  return distance < current.distance
}

function guideFor(
  match: Match,
  candidates: readonly SnapCandidate[],
  moved: AxisView,
  axis: SnapAxis,
): SnapGuide {
  const { candidate } = match
  const spacing = candidate.spacing

  if (spacing !== undefined) {
    return {
      axis,
      kind: candidate.kind,
      value: candidate.value,
      from: moved.crossStart,
      to: moved.crossEnd,
      centered: false,
      gaps: gapsFor(spacing, moved, axis),
    }
  }

  // Everything that sits on the matched coordinate contributes to the span, so three siblings that
  // share a left edge get one line across all three rather than a line to the nearest of them.
  let from = moved.crossStart
  let to = moved.crossEnd

  for (const other of candidates) {
    if (
      other.axis === axis &&
      other.from !== undefined &&
      other.to !== undefined &&
      approxEqual(other.value, candidate.value)
    ) {
      from = Math.min(from, other.from)
      to = Math.max(to, other.to)
    }
  }

  return {
    axis,
    kind: candidate.kind,
    value: candidate.value,
    from,
    to,
    centered: candidate.centered ?? false,
    gaps: [],
  }
}

/** The two gaps the snap made equal, measured off the box where it actually landed. */
function gapsFor(
  spacing: NonNullable<SnapCandidate['spacing']>,
  moved: AxisView,
  axis: SnapAxis,
): readonly SnapGap[] {
  const cross = (moved.crossStart + moved.crossEnd) / 2

  return [
    {
      axis,
      start: spacing.before,
      end: moved.start,
      cross,
      distance: moved.start - spacing.before,
    },
    {
      axis,
      start: moved.end,
      end: spacing.after,
      cross,
      distance: spacing.after - moved.end,
    },
  ]
}
