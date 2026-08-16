import type { EffectTint } from '../shared'
import { tintVar } from '../shared'

/** Where each stop sits before the animation starts kneading them. */
const STOPS = [
  { x: '18%', y: '22%' },
  { x: '82%', y: '18%' },
  { x: '25%', y: '78%' },
  { x: '75%', y: '82%' },
] as const

/**
 * Four radial stops in one `background-image`, not four elements. `background-position` animates all
 * four together on one layer, and the mix between overlapping stops is what makes a mesh read as a
 * surface rather than as four spots.
 */
export function meshBackground(
  tints: readonly [EffectTint, EffectTint, EffectTint],
  spread: number,
): string {
  const [first, second, third] = tints
  const order: readonly EffectTint[] = [first, second, third, first]

  return STOPS.map((stop, index) => {
    const tint = order[index] ?? first

    return `radial-gradient(circle at ${stop.x} ${stop.y}, color-mix(in oklab, ${tintVar(tint)} 85%, transparent) 0%, transparent ${spread}%)`
  }).join(', ')
}
