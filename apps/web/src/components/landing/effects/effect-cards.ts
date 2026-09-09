import type { Dictionary } from '../../../lib/i18n/dictionary'

/**
 * Six of the thirteen, on two criteria: each one moves on its own, and no two neighbours in the order
 * are the same kind of mark.
 *
 * The band used to include `spotlight` and `dot-grid`. Measured over five frames a second apart,
 * three of the six were byte-identical every time: the spotlight is written from the pointer and
 * there is no pointer on a band being scrolled past, and the dot grid is a texture with nothing to
 * animate. A band whose subject is motion cannot spend half its turns standing still.
 *
 * The order alternates field, line, sweep, field, band, point, so the plate does not show two washes
 * of colour in a row while the reader waits to see something else.
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
    id: 'mesh-gradient',
    name: effects.meshName,
    description: effects.meshDescription,
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
