import type { Dictionary } from '../../../lib/i18n/dictionary'

/**
 * Six of the thirteen, chosen so the row shows the range rather than the catalogue: an ambient field,
 * a pointer-driven light, a border treatment, a texture, a sweep and a particle field. The copy says
 * what the registry's own description says, in the language the page is being read in.
 */
export interface EffectCard {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const effectCards = (effects: Dictionary['landing']['effects']): readonly EffectCard[] => [
  {
    id: 'aurora-background',
    name: effects.auroraName,
    description: effects.auroraDescription,
  },
  {
    id: 'spotlight',
    name: effects.spotlightName,
    description: effects.spotlightDescription,
  },
  {
    id: 'border-beam',
    name: effects.borderBeamName,
    description: effects.borderBeamDescription,
  },
  {
    id: 'dot-grid',
    name: effects.dotGridName,
    description: effects.dotGridDescription,
  },
  {
    id: 'beams',
    name: effects.beamsName,
    description: effects.beamsDescription,
  },
  {
    id: 'particles',
    name: effects.particlesName,
    description: effects.particlesDescription,
  },
]
