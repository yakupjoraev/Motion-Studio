import {
  EASINGS,
  type EasingName,
  SPRINGS,
  type SpringConfig,
  type SpringName,
} from '@motion-studio/motion'

/**
 * A preset's curve parameters are **names** — `easing: 'standard'`, `spring: 'snappy'` — because
 * that is what `MotionSpec.params` may hold (FILE_FORMAT.md: number, string or boolean) and what a
 * preset's own schema declares. The editors from prompt 09 are continuous, so dragging one produces
 * a curve the document has no field for.
 *
 * ADR-151: the drag stays continuous and the commit snaps to the nearest named curve. The editor
 * redraws and the preview re-runs while the pointer moves, which is the feedback loop the panel
 * exists for; what lands in the document is still a name, so a `.motion` file stays portable and the
 * export keeps emitting a token rather than four magic numbers.
 */
export function nearestEasing(curve: readonly [number, number, number, number]): EasingName {
  let best: EasingName = 'standard'
  let bestDistance = Number.POSITIVE_INFINITY

  for (const [name, candidate] of Object.entries(EASINGS) as [EasingName, readonly number[]][]) {
    const distance = candidate.reduce(
      (total, value, index) => total + Math.abs(value - (curve[index] ?? 0)),
      0,
    )

    if (distance < bestDistance) {
      best = name
      bestDistance = distance
    }
  }

  return best
}

/** The same idea for springs, weighted so stiffness — the parameter a user drags — decides most. */
export function nearestSpring(config: SpringConfig): SpringName {
  let best: SpringName = 'gentle'
  let bestDistance = Number.POSITIVE_INFINITY

  for (const [name, candidate] of Object.entries(SPRINGS) as [SpringName, SpringConfig][]) {
    const distance =
      Math.abs(candidate.stiffness - config.stiffness) / 100 +
      Math.abs(candidate.damping - config.damping) / 20 +
      Math.abs(candidate.mass - config.mass)

    if (distance < bestDistance) {
      best = name
      bestDistance = distance
    }
  }

  return best
}
