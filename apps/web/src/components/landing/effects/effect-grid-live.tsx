'use client'

import { components as effectComponents } from '@motion-studio/blocks/effects'
import { type ComponentType, Suspense } from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'

import { effectCards } from './effect-cards'
import { EffectShell } from './effect-shell'

/**
 * The catalogue's own components, with the catalogue's own defaults. Each one is `lazy()` in the
 * effects map, so a card fetches its effect and nothing else — and `Suspense` per card means the
 * grid fills in as they land rather than waiting for the slowest.
 *
 * Reduced motion is each effect's own responsibility and every one of them honours it
 * (ANIMATION_SYSTEM.md § Reduced motion). That is the point of using the shipped components here: the
 * page cannot be more correct than the product, and it cannot be less.
 */
/*
 * The catalogue's defaults are tuned for a full-width section and these cards are 128 px tall, so
 * every one of them is set for this size rather than inherited. The aurora also drops its grain: at
 * this scale the grain is the only thing visible and it reads as noise rather than as light.
 *
 * The values are what ADR-301 measured, not what looked right. On a card whose entire subject is the
 * effect, the effect is the content, so it is held to the 3:1 that ACCESSIBILITY.md asks of any
 * non-text carrier of meaning — measured against the tile's own surface, in both the frame the grid
 * scrolls into view on and the reduced-motion steady state.
 */
const PROPS: Readonly<Record<string, Record<string, unknown>>> = {
  'aurora-background': {
    tint: 'accent',
    secondaryTint: 'info',
    intensity: 0.95,
    speed: 1,
    blur: 56,
    grain: false,
    scrim: false,
  },
  'mesh-gradient': {
    tint: 'accent',
    secondaryTint: 'info',
    tertiaryTint: 'success',
    intensity: 0.9,
    speed: 1.3,
    blur: 72,
    spread: 68,
    scrim: false,
  },
  /*
   * A 2 px arc was measured for a 128 px card and reads as nothing on a tile this size: the beam is
   * the only mark on the tile and it was a hairline crossing a sheet of vellum. Four pixels and a
   * wider arc give it the same weight on the tile that two gave it on the card.
   */
  'border-beam': { tint: 'accent', intensity: 1, speed: 1.2, borderWidth: 4, arc: 75 },
  /*
   * `speed` is the one value here that is not about size. The shine travels in the first fifth of its
   * cycle and waits out the rest — deliberately, and correct on a card a reader is sitting in front
   * of. On a rail being scrolled past, a tile is on screen for a couple of seconds, so at the default
   * speed most readers meet it during the wait: measured over five frames a second apart, the tile was
   * byte-identical every time. Doubling the speed shortens the wait, not the travel.
   */
  shine: { tint: 'accent', intensity: 0.7, speed: 2, width: 46, angle: 20 },
  beams: { tint: 'accent', intensity: 1, speed: 0.8, count: 3, width: 56, angle: -18 },
  /*
   * `count` was 130 against a schema whose ceiling is 80 — the card renders props directly rather
   * than through `parse`, so nothing rejected it. Eighty is the cap for the reason the schema gives.
   */
  particles: { tint: 'accent', intensity: 1, speed: 1.3, count: 80, size: 3, seed: 7 },
}

/**
 * The values above were measured for a 128 px card (ADR-301) and every tile on the rail is now the
 * size the featured tile used to be, so the corrections measured for that size apply to all of them:
 * a 56 px blur over that much surface is a smear rather than the same effect larger.
 */
const RAIL_PROPS: Readonly<Record<string, Record<string, unknown>>> = {
  'aurora-background': { blur: 104, intensity: 0.85, speed: 0.85 },
}

export function EffectGridLive() {
  const { effects } = useLanding()

  const cards = effectCards(effects)

  return (
    <>
      {cards.map((card, index) => {
        const Effect = effectComponents[card.id as keyof typeof effectComponents] as
          | ComponentType<Record<string, unknown>>
          | undefined
        return (
          <EffectShell card={card} index={index} key={card.id} total={cards.length}>
            {Effect === undefined ? null : (
              <Suspense fallback={null}>
                <Effect {...(PROPS[card.id] ?? {})} {...(RAIL_PROPS[card.id] ?? {})} />
              </Suspense>
            )}
          </EffectShell>
        )
      })}
    </>
  )
}
