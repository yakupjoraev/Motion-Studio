/**
 * The nested radius rule from `DESIGN_SYSTEM.md` § Radius: an inner radius is the outer radius minus
 * the gap between them. A card at `lg` (12) with `p-2` (8) gives its child `xs` (4).
 *
 * Blocks call this rather than eyeballing a value, because getting it wrong is the specific defect
 * that reads as amateur — concentric corners that are not concentric.
 *
 * Never negative: a gap wider than the outer radius means the inner corner is already square.
 */
export function innerRadius(outer: number, gap: number): number {
  return Math.max(0, outer - gap)
}
