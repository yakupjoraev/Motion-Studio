'use client'

import { components as effectComponents } from '@motion-studio/blocks/effects'
import { type ComponentType, Suspense, useEffect, useState } from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'
import { useInView } from '../use-in-view'

import { effectCards } from './effect-cards'
import { EffectStack } from './effect-stack'
import { EffectStage } from './effect-stage'

/**
 * The catalogue's own components, with the catalogue's own defaults, one at a time.
 *
 * Reduced motion is each effect's own responsibility and every one of them honours it
 * (ANIMATION_SYSTEM.md § Reduced motion). That is the point of using the shipped components here: the
 * page cannot be more correct than the product, and it cannot be less. The cycle itself is the band's,
 * so the band stops it under reduced motion too — the effects would be still and the plate would be
 * changing subject every few seconds for no reason a reader asked for.
 */
/*
 * The plate is most of a viewport rather than a 128 px tile, so the catalogue's defaults do not apply:
 * ADR-301 measured them for the small card. Blur scales with area, a beam's width has to grow with the
 * surface it crosses, and a two-pixel arc is a hairline on an artboard.
 */
const PROPS: Readonly<Record<string, Record<string, unknown>>> = {
  'aurora-background': {
    tint: 'accent',
    secondaryTint: 'info',
    intensity: 1,
    speed: 1.1,
    blur: 120,
    /* Off, for the reason it was measured off on the small tile: at any size the reader meets on a
       phone the grain is the loudest thing on the plate and it reads as noise, not as light. */
    grain: false,
    scrim: false,
  },
  'mesh-gradient': {
    tint: 'accent',
    secondaryTint: 'info',
    tertiaryTint: 'success',
    intensity: 0.95,
    speed: 1.3,
    blur: 104,
    spread: 72,
    scrim: false,
  },
  beams: { tint: 'accent', intensity: 1, speed: 1, count: 4, width: 104, angle: -22 },
  'border-beam': { tint: 'accent', intensity: 1, speed: 1.4, borderWidth: 5, arc: 80 },
  /*
   * The shine travels in the first fifth of its cycle and waits out the rest, which is the effect's
   * whole character on a card someone is sitting in front of. Here the plate holds it for a few
   * seconds and then moves on, so the wait has to be short enough to be seen inside that window.
   */
  shine: { tint: 'accent', intensity: 0.85, speed: 2.2, width: 52, angle: 18 },
  /* Eighty is the schema's ceiling and the field reads as noise past it. */
  particles: { tint: 'accent', intensity: 1, speed: 1.2, count: 80, size: 3.5, seed: 7 },
}

/** How long one effect holds the plate. Long enough to watch a cycle of it, short enough to wait for. */
const DWELL = 5200

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function EffectGridLive() {
  const { effects } = useLanding()
  const cards = effectCards(effects)
  const { ref, seen } = useInView()
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (held || !seen || prefersReducedMotion()) {
      return
    }

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % cards.length)
    }, DWELL)

    return () => {
      window.clearInterval(timer)
    }
  }, [cards.length, held, seen])

  const card = cards[active] ?? cards[0]

  if (card === undefined) {
    return null
  }

  const Effect = effectComponents[card.id as keyof typeof effectComponents] as
    | ComponentType<Record<string, unknown>>
    | undefined

  return (
    <div
      className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8"
      ref={ref}
    >
      <EffectStack
        active={active}
        cards={cards}
        onPick={(index) => {
          setActive(index)
          setHeld(true)
        }}
        title={effects.stackTitle}
      />

      <EffectStage card={card}>
        {Effect === undefined ? null : (
          <Suspense fallback={null}>
            {/* `key` so switching layers remounts rather than restyling: an effect's animation is
                declared on mount, and a swapped prop set would leave the old one mid-cycle. */}
            <Effect key={card.id} {...(PROPS[card.id] ?? {})} />
          </Suspense>
        )}
      </EffectStage>
    </div>
  )
}
