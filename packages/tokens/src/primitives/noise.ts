/**
 * `DESIGN_SYSTEM.md` § Noise and grain. Applied as a `::after` overlay with
 * `mix-blend-mode: overlay` and `pointer-events: none`.
 *
 * Amounts above `medium` on light surfaces read as dirt — the inspector caps light-mode noise at
 * `light` unless overridden. That cap belongs to the inspector, not to this table.
 */
export const NOISE = {
  none: 0,
  subtle: 0.015,
  light: 0.03,
  medium: 0.06,
  heavy: 0.1,
} as const

/**
 * One `feTurbulence` asset as a data URL — no network request, tiled by the browser. 342 bytes.
 *
 * Each parameter, and why it is that value:
 * - `fractalNoise`, not `turbulence`: `turbulence` takes the absolute value of the noise field, which
 *   produces visible dark veins instead of even grain.
 * - `baseFrequency=".85"` puts the grain near one cycle per pixel at 1× — fine enough to read as film
 *   grain rather than as a pattern, coarse enough to survive a JPEG-quality screenshot.
 * - `numOctaves="3"`: two reads as regular, four costs render time for a difference nobody can see at
 *   these opacities.
 * - `stitchTiles="stitch"` is what makes the tile seamless. Without it every tile edge is a visible
 *   seam once the browser repeats the image.
 * - 120 px, not 64: a smaller tile repeats often enough that the eye finds the period.
 */
export const NOISE_TEXTURE =
  'data:image/svg+xml;base64,' +
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIj48' +
  'ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjg1' +
  'IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEyMCIg' +
  'aGVpZ2h0PSIxMjAiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg=='

export type NoiseToken = keyof typeof NOISE
