import type { Dictionary } from '../../../lib/i18n/dictionary'

/**
 * Six of the thirteen, and the criterion is that each one moves on its own.
 *
 * The row used to be chosen for range and included `spotlight` and `dot-grid`. Measured over five
 * frames a second apart, three of the six tiles were byte-identical every time: the spotlight is
 * written from the pointer and there is no pointer on a card being scrolled past, and the dot grid is
 * a texture with nothing to animate. A rail whose subject is motion cannot spend half its tiles
 * standing still, so those two are shown in the catalogue instead and the rail takes the effects that
 * carry themselves — `mesh-gradient` and `shine`, both measured moving.
 *
 * The copy says what the registry's own description says, in the language the page is being read in.
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
    id: 'mesh-gradient',
    name: effects.meshName,
    description: effects.meshDescription,
  },
  {
    id: 'border-beam',
    name: effects.borderBeamName,
    description: effects.borderBeamDescription,
  },
  {
    id: 'shine',
    name: effects.shineName,
    description: effects.shineDescription,
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
