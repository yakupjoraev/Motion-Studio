import type { Dictionary } from '../../../lib/i18n/dictionary'

/**
 * Five of the thirteen, on two criteria: each one moves on its own, and each is a different kind of
 * mark — a field, a lit edge, a band of light, a point field, a second field that behaves nothing
 * like the first.
 *
 * The band used to include `spotlight`, `dot-grid` and `shine`. Measured over five frames a second
 * apart, all three were byte-identical every time: the spotlight is written from the pointer and
 * there is no pointer on a band being scrolled past, the dot grid is a texture with nothing to
 * animate, and the shine spends four fifths of its cycle waiting. A band whose subject is motion
 * cannot spend half its cells standing still, and those three are shown in the catalogue instead,
 * where a reader has a pointer and time.
 *
 * Five rather than six because the bento is five cells: a grid with a spare tile at the end is a grid
 * planned for a different number.
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
