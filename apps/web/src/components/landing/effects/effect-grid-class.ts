/**
 * The bento the band is laid out in, shared by the server's fallback and the live island so the swap
 * moves nothing (ADR-295).
 *
 * Two columns from `sm`, three from `lg`, with the lead cell spanning two of each. Five cells for five
 * effects: a grid with an empty tile at the end is a grid that was planned for a different number.
 */
export const EFFECT_GRID_CLASS = 'grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5'
