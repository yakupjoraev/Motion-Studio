import { snapTo } from '@motion-studio/utils'

import { AXES, type AxisView, EDGES, axisView, edgeValue, overlaps } from './axis'
import type { SnapAxis, SnapBox, SnapCandidate, SnapCandidateInput } from './snap.types'

/**
 * CANVAS.md § Snapping: the five generators, run **once at drag start**.
 *
 * Nothing here changes while the pointer is down. Siblings do not move, the container does not
 * resize, the user guides stay where they are, and the grid is a constant — so a per-frame call
 * would recompute an identical array sixty times a second and allocate it again each time. What does
 * change is the moving box, and it is not an input: every rule below is a position in the layout,
 * which the resolver then compares the live box against.
 *
 * The one rule that could have read the moving box is equal spacing, and ADR-084 is why it does not.
 */
export function generateSnapCandidates(input: SnapCandidateInput): readonly SnapCandidate[] {
  const candidates: SnapCandidate[] = []

  for (const axis of AXES) {
    const moving = axisView(input.moving, axis)

    addGrid(candidates, moving, axis, input.gridSize ?? 0)
    addSiblingEdges(candidates, input.siblings, axis)
    addContainer(candidates, input.container, axis)
    addUserGuides(candidates, input, axis)
    addSpacing(candidates, input.siblings, moving, axis)
  }

  return candidates
}

/** Nearest multiple of the grid for each moving edge and centre, so all three can be on the grid. */
function addGrid(
  candidates: SnapCandidate[],
  moving: AxisView,
  axis: SnapAxis,
  gridSize: number,
): void {
  if (gridSize <= 0) {
    return
  }

  for (const edge of EDGES) {
    candidates.push({ axis, kind: 'grid', edge, value: snapTo(edgeValue(moving, edge), gridSize) })
  }
}

/** Left / right / centre-x of every sibling, and the same on the other axis. */
function addSiblingEdges(
  candidates: SnapCandidate[],
  siblings: readonly SnapBox[],
  axis: SnapAxis,
): void {
  for (const sibling of siblings) {
    const view = axisView(sibling.rect, axis)

    for (const edge of EDGES) {
      candidates.push({
        axis,
        kind: 'edge',
        value: edgeValue(view, edge),
        sourceId: sibling.id,
        centered: edge === 'center',
        from: view.crossStart,
        to: view.crossEnd,
      })
    }
  }
}

/** The parent's content box: its edges and its centres, which is the `center` kind's whole meaning. */
function addContainer(
  candidates: SnapCandidate[],
  container: SnapCandidateInput['container'],
  axis: SnapAxis,
): void {
  if (container === undefined) {
    return
  }

  const view = axisView(container, axis)

  for (const edge of EDGES) {
    candidates.push({
      axis,
      kind: 'center',
      value: edgeValue(view, edge),
      centered: edge === 'center',
      from: view.crossStart,
      to: view.crossEnd,
    })
  }
}

function addUserGuides(
  candidates: SnapCandidate[],
  input: SnapCandidateInput,
  axis: SnapAxis,
): void {
  for (const guide of input.guides ?? []) {
    if (guide.axis === axis) {
      candidates.push({ axis, kind: 'guide', value: guide.value })
    }
  }
}

/**
 * ADR-090: for each sibling, the next one along the axis that shares its band on the perpendicular
 * one — its neighbour in the same row or column. The value is where the moving box's **leading** edge
 * goes for the two gaps to come out equal, so the candidate is restricted to that edge — ADR-083.
 */
function addSpacing(
  candidates: SnapCandidate[],
  siblings: readonly SnapBox[],
  moving: AxisView,
  axis: SnapAxis,
): void {
  const views = siblings
    .map((sibling) => axisView(sibling.rect, axis))
    .sort((a, b) => a.start - b.start)

  for (let index = 0; index < views.length; index += 1) {
    const before = views[index]
    const after = before === undefined ? undefined : nextInBand(views, index, before)

    if (before === undefined || after === undefined) {
      continue
    }

    const gap = (after.start - before.end - moving.size) / 2

    if (gap <= 0) {
      continue
    }

    candidates.push({
      axis,
      kind: 'spacing',
      edge: 'start',
      value: before.end + gap,
      from: Math.min(before.crossStart, after.crossStart),
      to: Math.max(before.crossEnd, after.crossEnd),
      spacing: { gap, before: before.end, after: after.start },
    })
  }
}

/**
 * The next sibling that is clear of this one along the axis and overlaps it on the other, which is
 * what "the box next to it" means in a layout: a card in the row below sorts between two cards of
 * this row and is not between them in any sense a user would recognise.
 */
function nextInBand(
  views: readonly AxisView[],
  index: number,
  before: AxisView,
): AxisView | undefined {
  for (let next = index + 1; next < views.length; next += 1) {
    const candidate = views[next]

    if (candidate !== undefined && candidate.start >= before.end && overlaps(before, candidate)) {
      return candidate
    }
  }

  return undefined
}
