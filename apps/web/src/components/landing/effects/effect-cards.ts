/**
 * Six of the thirteen, chosen so the row shows the range rather than the catalogue: an ambient field,
 * a pointer-driven light, a border treatment, a texture, a sweep and a particle field. The copy is
 * the registry's own description, so the page and the block cannot disagree about what a block does.
 */
export interface EffectCard {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const EFFECT_CARDS: readonly EffectCard[] = [
  {
    id: 'aurora-background',
    name: 'Aurora',
    description: 'Two-hue blurred fields drifting on unrelated periods behind the content.',
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    description: 'A soft light that follows the pointer, written from the shared pointer bus.',
  },
  {
    id: 'border-beam',
    name: 'Border beam',
    description: 'A lit arc travelling around the node’s own border, masked from a conic gradient.',
  },
  {
    id: 'dot-grid',
    name: 'Dot grid',
    description: 'A tiled dot lattice, faded at the edges, as surface texture.',
  },
  {
    id: 'beams',
    name: 'Beams',
    description: 'Tilted bands of light sweeping across the surface on staggered cycles.',
  },
  {
    id: 'particles',
    name: 'Particles',
    description: 'A deterministic field of points drifting upward on their own periods.',
  },
]
