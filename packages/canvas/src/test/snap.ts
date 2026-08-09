import { nodeId } from '@motion-studio/schema'

import { type CanvasRect, canvasRect } from '../coords/index'
import type { SnapBox, SnapCandidate } from '../snap/snap.types'

export const rect = (x: number, y: number, width: number, height: number): CanvasRect =>
  canvasRect({ x, y, width, height })

export const box = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): SnapBox => ({ id: nodeId(`node_${name}`), rect: rect(x, y, width, height) })

/** The values a kind produced on one axis, sorted, so an expectation reads as a list of numbers. */
export const valuesOf = (
  candidates: readonly SnapCandidate[],
  kind: SnapCandidate['kind'],
  axis: SnapCandidate['axis'],
): number[] =>
  candidates
    .filter((candidate) => candidate.kind === kind && candidate.axis === axis)
    .map((candidate) => candidate.value)
    .sort((a, b) => a - b)
