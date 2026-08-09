/**
 * The 1-2-5 ladder. ADR-088 derives it from the three points the canvas is specified at — 100 canvas
 * units per major tick at 100 % zoom, 500 at 25 %, 50 at 200 % — and the minimum spacing below is
 * the top of the interval that reproduces all three.
 */
export const TICK_LADDER: readonly number[] = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000,
]

export const MIN_MAJOR_SPACING_PX = 100

/** Canvas units between labelled ticks: the smallest ladder step at least 100 screen px wide. */
export function majorTickStep(zoom: number): number {
  for (const step of TICK_LADDER) {
    if (step * zoom >= MIN_MAJOR_SPACING_PX) {
      return step
    }
  }

  return TICK_LADDER[TICK_LADDER.length - 1] ?? 1
}

/**
 * Subdivision by leading digit — 1 into ten parts, 2 into four, 5 into five — which keeps a minor
 * tick between 10 and 62 screen px however far the major has drifted from the minimum.
 */
export function minorTickStep(major: number): number {
  const digit = major / 10 ** Math.floor(Math.log10(major))

  if (digit === 2) {
    return major / 4
  }

  if (digit === 5) {
    return major / 5
  }

  return major / 10
}

/** Every multiple of `step` inside the range, which is what the ruler labels. */
export function rulerTicks(from: number, to: number, step: number): number[] {
  if (step <= 0 || to < from) {
    return []
  }

  const ticks: number[] = []

  for (let value = Math.ceil(from / step) * step; value <= to; value += step) {
    ticks.push(value)
  }

  return ticks
}
