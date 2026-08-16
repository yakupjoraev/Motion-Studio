import type { CSSProperties } from 'react'

export interface Particle {
  readonly left: number
  readonly bottom: number
  readonly size: number
  readonly drift: number
  readonly cycle: number
  readonly delay: number
}

/**
 * A hash, not a random number generator. `Math.random()` would place a different field on every
 * render — a thumbnail that never matches itself (ADR-123) and an export whose output changes
 * between two runs of the same document. A pure function of `(seed, index)` gives a field that looks
 * scattered and is completely reproducible.
 */
function hash(seed: number, index: number, salt: number): number {
  const value = Math.sin((seed + 1) * 127.1 + index * 311.7 + salt * 74.7) * 43758.5453

  return value - Math.floor(value)
}

export function particleField(count: number, size: number, seed: number): readonly Particle[] {
  return Array.from({ length: count }, (_unused, index) => ({
    left: Math.round(hash(seed, index, 1) * 10000) / 100,
    /*
     * Spread through the box rather than queued below it. Measured on the thumbnail stage: starting
     * every particle under the bottom edge left the reduced-motion composition — the one a stopped
     * document shows — completely empty, because the rise is what used to bring them into view.
     */
    bottom: Math.round(hash(seed, index, 2) * 8000) / 100 - 10,
    size: Math.round((0.6 + hash(seed, index, 3) * 0.8) * size * 100) / 100,
    drift: Math.round((hash(seed, index, 4) - 0.5) * 12000) / 100,
    cycle: Math.round((8 + hash(seed, index, 5) * 10) * 100) / 100,
    delay: Math.round(hash(seed, index, 6) * 1200) / 100,
  }))
}

export function particleStyle(particle: Particle, speed: number): CSSProperties {
  return {
    left: `${particle.left}%`,
    bottom: `${particle.bottom}%`,
    width: `${particle.size}px`,
    height: `${particle.size}px`,
    animationDuration: `${(particle.cycle / speed).toFixed(2)}s`,
    animationDelay: `${particle.delay.toFixed(2)}s`,
    '--ms-fx-drift': `${particle.drift}px`,
  } as CSSProperties
}
