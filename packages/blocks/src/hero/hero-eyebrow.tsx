import type { EyebrowStyle } from './hero.schema'
import { HERO_EYEBROW_DOT, heroEyebrowStyles } from './hero.styles'

export interface HeroEyebrowProps {
  readonly text: string
  readonly eyebrowStyle: EyebrowStyle
}

/** The line above the headline. Empty text renders nothing rather than an empty line of rhythm. */
export function HeroEyebrow({ text, eyebrowStyle }: HeroEyebrowProps) {
  if (text === '') {
    return null
  }

  return (
    <p className={heroEyebrowStyles({ eyebrowStyle })}>
      {eyebrowStyle === 'pill' && <span aria-hidden="true" className={HERO_EYEBROW_DOT} />}
      {text}
    </p>
  )
}
