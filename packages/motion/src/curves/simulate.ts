/** The three numbers a damped harmonic oscillator needs. `ANIMATION_SYSTEM.md` § Springs names seven sets. */
export interface SpringConfig {
  readonly stiffness: number
  readonly damping: number
  readonly mass: number
}

/**
 * Position over time for a spring released at 0 and pulled to 1, sampled every `dt` seconds.
 *
 * Semi-implicit (symplectic) Euler, specified in prompt 30: it stays stable at `dt = 1/60` for every
 * spring in the catalogue, where explicit Euler diverges at 550 N/m, and RK4 buys accuracy below the
 * pixel grid of a 240 px curve for four evaluations per step.
 *
 * The first sample is `t = 0`, so a caller drawing the curve starts at the origin rather than one
 * frame into the motion.
 */
export function simulateSpring(config: SpringConfig, dt: number, steps: number): number[] {
  const samples: number[] = []

  let position = 0
  let velocity = 0

  for (let step = 0; step < steps; step += 1) {
    samples.push(position)

    // Velocity first, then position from the *new* velocity: that ordering is what makes it symplectic.
    const acceleration =
      (config.stiffness * (1 - position) - config.damping * velocity) / config.mass

    velocity += acceleration * dt
    position += velocity * dt
  }

  return samples
}
