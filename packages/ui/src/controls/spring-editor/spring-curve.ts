import { simulateSpring } from '@motion-studio/motion/curves'

import type { SpringConfig } from '@motion-studio/motion'

/** One frame at 60 Hz, the step `simulateSpring` is specified to stay stable at. */
export const DT = 1 / 60

/** Two seconds. Past that a spring in the catalogue has settled, and the curve is drawn flat. */
export const STEPS = 120

/**
 * An SVG polyline of the spring's response, sized to a `width × height` box with `y = 1` at the top.
 *
 * The vertical range is fixed at 0 → 1.6 rather than fitted to the samples: a curve that rescaled itself
 * as the damping slider moved would hide the overshoot the slider is being used to look at.
 */
export const OVERSHOOT_CEILING = 1.6

export function springPolyline(config: SpringConfig, width: number, height: number): string {
  const samples = simulateSpring(config, DT, STEPS)
  const step = width / Math.max(1, samples.length - 1)

  return samples
    .map((position, index) => {
      const y = height - (position / OVERSHOOT_CEILING) * height

      return `${(index * step).toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

/**
 * The frame the response first stays inside 1 % of its rest position and never leaves again, or `null`
 * when it has not settled inside the window. Read out beside the sliders, because "how long does this
 * take" is the question a designer is actually asking of a spring.
 */
export function settleFrame(config: SpringConfig): number | null {
  const samples = simulateSpring(config, DT, STEPS)

  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (Math.abs((samples[index] ?? 0) - 1) > 0.01) {
      return index + 1 >= samples.length ? null : index + 1
    }
  }

  return 0
}

export function settleMs(config: SpringConfig): number | null {
  const frame = settleFrame(config)

  return frame === null ? null : Math.round(frame * DT * 1000)
}
