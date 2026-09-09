'use client'

import { components as effectComponents } from '@motion-studio/blocks/effects'
import { type ComponentType, Suspense } from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'

import { effectCards } from './effect-cards'
import { EFFECT_GRID_CLASS } from './effect-grid-class'
import { EffectStage } from './effect-stage'

/**
 * The catalogue's own components, with the catalogue's own defaults, all of them running.
 *
 * Reduced motion is each effect's own responsibility and every one of them honours it
 * (ANIMATION_SYSTEM.md § Reduced motion). That is the point of using the shipped components here: the
 * page cannot be more correct than the product, and it cannot be less. Nothing on this band switches
 * or cycles: the effects are the content, and content a reader has to click through is content the
 * page is hiding.
 */
/*
 * Every value is set for the cell it lands in. ADR-301 measured the catalogue's defaults for a 128 px
 * tile; blur scales with area, a beam's width has to grow with the surface it crosses, and a 2 px arc
 * is a hairline on a plate. The lead cell is four times the area of the others, so it carries the
 * effect that has the most to say at that size.
 */
const PROPS: Readonly<Record<string, Record<string, unknown>>> = {
  'aurora-background': {
    tint: 'accent',
    secondaryTint: 'info',
    intensity: 1,
    speed: 1.15,
    blur: 132,
    /* Off, and measured off: at any size a phone shows, the grain is the loudest thing on the plate
       and it reads as noise rather than as light. */
    grain: false,
    scrim: false,
  },
  beams: { tint: 'accent', intensity: 1, speed: 1.1, count: 4, width: 88, angle: -24 },
  'border-beam': { tint: 'accent', intensity: 1, speed: 1.5, borderWidth: 5, arc: 85 },
  /* Eighty is the schema's ceiling; past it the field reads as noise. */
  particles: { tint: 'accent', intensity: 1, speed: 1.35, count: 80, size: 3.5, seed: 7 },
  'mesh-gradient': {
    tint: 'accent',
    secondaryTint: 'info',
    tertiaryTint: 'success',
    intensity: 1,
    speed: 1.4,
    blur: 88,
    spread: 74,
    scrim: false,
  },
}

export function EffectGridLive() {
  const { effects } = useLanding()
  const cards = effectCards(effects)

  return (
    <div className={EFFECT_GRID_CLASS}>
      {cards.map((card, index) => {
        const Effect = effectComponents[card.id as keyof typeof effectComponents] as
          | ComponentType<Record<string, unknown>>
          | undefined

        return (
          <EffectStage card={card} key={card.id} lead={index === 0}>
            {Effect === undefined ? null : (
              <Suspense fallback={null}>
                <Effect {...(PROPS[card.id] ?? {})} />
              </Suspense>
            )}
          </EffectStage>
        )
      })}
    </div>
  )
}
