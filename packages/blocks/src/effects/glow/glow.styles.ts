import type { GlowOrigin } from './glow.schema'

/**
 * Where the light comes from. A gradient origin rather than a position, so the field always fills
 * the box and only its bright point moves — sliding an element instead would leave a dark corner.
 */
export const GLOW_ORIGIN_VALUE: Readonly<Record<GlowOrigin, string>> = {
  center: 'center',
  top: 'top center',
  bottom: 'bottom center',
  left: 'center left',
  right: 'center right',
}
