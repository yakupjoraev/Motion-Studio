/**
 * ADR-075's mechanism, reused: `--ms-reduced-motion` is `1` normally, `0` from the media query, and
 * `0` inline when the studio forces the reduced design for preview. Reading the resolved variable
 * therefore answers all three, which `matchMedia('(prefers-reduced-motion: reduce)')` does not — it
 * would miss the studio's own override and a block would keep moving inside a preview of stillness.
 *
 * Everything a block can express in CSS is handled in CSS (`packages/blocks/src/styles/blocks.css`).
 * This exists for the one thing CSS cannot decide: whether a `<video>` element starts playing.
 */
export function prefersReducedMotion(element: Element): boolean {
  return getComputedStyle(element).getPropertyValue('--ms-reduced-motion').trim() === '0'
}
