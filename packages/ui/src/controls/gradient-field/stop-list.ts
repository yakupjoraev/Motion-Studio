import { clamp } from '@motion-studio/utils'

import type { ColorStop } from '@motion-studio/tokens'

/** Two is the fewest a gradient can be drawn from, so the delete affordance stops there. */
export const MIN_STOPS = 2

export interface StopEdit {
  readonly stops: readonly ColorStop[]
  /** Which stop the caller should keep selected — a moved stop can change index. */
  readonly selected: number
}

/**
 * Sorted by position, because that is the order CSS reads stops in. Selection follows the stop the user
 * was holding rather than the index it used to sit at, which is what makes dragging one past another feel
 * like one continuous gesture.
 */
function sorted(stops: readonly ColorStop[], moved: ColorStop): StopEdit {
  const next = [...stops].sort((a, b) => a.position - b.position)

  return { stops: next, selected: next.indexOf(moved) }
}

export function moveStop(stops: readonly ColorStop[], index: number, position: number): StopEdit {
  const stop = stops[index]

  if (stop === undefined) {
    return { stops, selected: index }
  }

  const moved: ColorStop = { color: stop.color, position: clamp(Math.round(position), 0, 100) }

  return sorted(
    stops.map((entry, at) => (at === index ? moved : entry)),
    moved,
  )
}

export function setStopColor(stops: readonly ColorStop[], index: number, color: string): StopEdit {
  return {
    stops: stops.map((entry, at) => (at === index ? { ...entry, color } : entry)),
    selected: index,
  }
}

/**
 * Half way to the next stop, in the colour of the one it was added from. Guessing an interpolated colour
 * would put a value on the track the user never chose.
 */
export function addStop(stops: readonly ColorStop[], after: number): StopEdit {
  const stop = stops[after]

  if (stop === undefined) {
    return { stops, selected: after }
  }

  const next = stops[after + 1]?.position ?? 100
  const added: ColorStop = {
    color: stop.color,
    position: Math.round((stop.position + next) / 2),
  }

  return sorted([...stops, added], added)
}

export function removeStop(stops: readonly ColorStop[], index: number): StopEdit {
  if (stops.length <= MIN_STOPS) {
    return { stops, selected: index }
  }

  const next = stops.filter((_, at) => at !== index)

  return { stops: next, selected: clamp(index, 0, next.length - 1) }
}
