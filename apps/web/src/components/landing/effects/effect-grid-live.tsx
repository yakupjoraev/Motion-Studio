'use client'

import { components as effectComponents } from '@motion-studio/blocks/effects'
import { type ComponentType, Suspense } from 'react'

import { EFFECT_CARDS } from './effect-cards'
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
 * The catalogue's defaults are tuned for a full-width section; these cards are 128 px tall, so the
 * two that read as texture at that size are lifted and the aurora drops its grain — at this scale the
 * grain is the only thing visible and it reads as noise rather than as light.
 */
const PROPS: Readonly<Record<string, Record<string, unknown>>> = {
  'aurora-background': {
    tint: 'accent',
    secondaryTint: 'info',
    intensity: 0.75,
    speed: 1,
    blur: 56,
    grain: false,
    scrim: false,
  },
  spotlight: { tint: 'accent', intensity: 0.45, reach: 55, followPointer: true },
  'border-beam': { tint: 'accent', intensity: 1, speed: 1, borderWidth: 2, arc: 55 },
  'dot-grid': { tint: 'foreground', intensity: 0.35, spacing: 16, dotSize: 1.5, fade: true },
  beams: { tint: 'accent', intensity: 0.5, speed: 0.8, count: 3, width: 56, angle: -18 },
  particles: { tint: 'accent', intensity: 1, speed: 0.6, count: 44, size: 2, seed: 7 },
}

export function EffectGridLive() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {EFFECT_CARDS.map((card) => {
        const Effect = effectComponents[card.id as keyof typeof effectComponents] as
          | ComponentType<Record<string, unknown>>
          | undefined

        return (
          <EffectShell card={card} key={card.id}>
            {Effect === undefined ? null : (
              <Suspense fallback={null}>
                <Effect {...(PROPS[card.id] ?? {})} />
              </Suspense>
            )}
          </EffectShell>
        )
      })}
    </div>
  )
}
