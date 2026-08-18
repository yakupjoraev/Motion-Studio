import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * The tray arrives from below, which is where a dock sits, and that is all the block declares.
 *
 * The magnification is deliberately **not** a motion channel. A channel animates the node's own wrapper,
 * and the wrapper here is the tray — a hover preset on this node would swell all six glyphs together,
 * which is the opposite of what a dock does. The per-item swell lives in `blocks.css`, driven by the
 * pointer bus (ADR-195), the same way the card grids lift their own cells rather than their grid.
 */
export const dockMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: {
    presetId: 'fade-up',
    channel: 'entrance',
    trigger: { kind: 'mount' },
    params: { distance: 14, duration: 440 },
  },
}
