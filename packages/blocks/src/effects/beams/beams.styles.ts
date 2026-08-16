import type { CSSProperties } from 'react'

/**
 * Where each beam starts and how far behind the one in front of it it runs. Both are derived from
 * the index rather than drawn at random: the same props have to place the same beams every time, or
 * the thumbnail generator stops being byte-deterministic (ADR-123).
 */
export function beamStyle(index: number, count: number, cycleShare: number): CSSProperties {
  const spread = 100 / (count + 1)

  return {
    left: `${spread * (index + 1)}%`,
    animationDelay: `calc(var(--ms-fx-cycle) * ${(cycleShare * index).toFixed(3)})`,
  }
}
