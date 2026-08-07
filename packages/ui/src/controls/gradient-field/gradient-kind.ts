import type { ColorStop, Gradient, Position } from '@motion-studio/tokens'

import type { StopGradientKind } from './gradient-field.types'

const CENTRE: Position = { x: 50, y: 50 }

/** Black to white: the two-stop gradient with no colour opinion in it. */
const DEFAULT_STOPS: readonly ColorStop[] = [
  { color: 'oklch(0% 0 0)', position: 0 },
  { color: 'oklch(100% 0 0)', position: 100 },
]

export function stopsOf(gradient: Gradient): readonly ColorStop[] {
  return gradient.kind === 'mesh' ? [] : gradient.stops
}

export function angleOf(gradient: Gradient): number {
  if (gradient.kind === 'linear') {
    return gradient.angle
  }

  return gradient.kind === 'conic' ? gradient.from : 0
}

export function atOf(gradient: Gradient): Position {
  return gradient.kind === 'radial' || gradient.kind === 'conic' ? gradient.at : CENTRE
}

export function withStops(gradient: Gradient, stops: readonly ColorStop[]): Gradient {
  return gradient.kind === 'mesh' ? gradient : { ...gradient, stops }
}

/**
 * Switching kinds keeps everything the new kind can hold: the stops, the centre, and the rotation — a
 * linear gradient's angle becomes a conic's `from`, since both measure the same turn. What the new kind
 * has no place for is dropped, which is the one lossy edge and the reason the switch is a deliberate act
 * rather than a preview.
 */
export function convertKind(gradient: Gradient, kind: StopGradientKind): Gradient {
  const carried = stopsOf(gradient)
  const stops = carried.length === 0 ? DEFAULT_STOPS : carried
  const at = atOf(gradient)

  if (kind === 'linear') {
    return { kind, angle: angleOf(gradient), stops }
  }

  if (kind === 'radial') {
    const shape = gradient.kind === 'radial' ? gradient.shape : 'ellipse'

    return { kind, shape, at, stops }
  }

  return { kind, from: angleOf(gradient), at, stops }
}
