'use client'

import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '../../reduced-motion'
import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { HERO_VIDEO_ELEMENT, HERO_VIDEO_FALLBACK, heroVideoScrimStyles } from './hero-video.styles'
import type { HeroVideoProps } from './hero-video.types'

/**
 * A full-bleed muted loop under a scrim.
 *
 * **The LCP element is the headline.** The video carries no `autoplay` attribute and `preload` stops
 * at metadata, so the first paint is the poster and the text — nothing decodes a frame ahead of them.
 * Playback is started afterwards, from an effect, and only when motion is allowed.
 *
 * That is also the reduced-motion behaviour, and it is one mechanism rather than two: with the studio
 * previewing reduced motion, or the operating system asking for it, `--ms-reduced-motion` resolves to
 * `0`, the effect returns, and what stays on screen is the poster — which is why the poster has to be
 * a designed frame rather than whatever the encoder produced at t=0.
 *
 * Design reference: impeccable.style — full-bleed media hero. The technique is the scrim: a gradient
 * rather than a flat overlay, heaviest where the type sits, so the footage stays legible as footage.
 */
export function HeroVideo({
  eyebrow,
  eyebrowStyle,
  headline,
  subtitle,
  actions,
  align,
  maxWidth,
  padding,
  minHeight,
  hidden,
  src,
  poster,
  captions,
  decorative,
  scrim,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (video === null || src === '') {
      return
    }

    if (prefersReducedMotion(video)) {
      return
    }

    // `play()` rejects when the browser's autoplay policy says no. That is a legitimate answer, not
    // an error: the poster is already on screen and stays there.
    Promise.resolve(video.play()).catch(() => undefined)
  }, [src])

  return (
    <section
      className={`${heroSectionStyles({ padding, minHeight, align, hidden })} justify-center overflow-hidden bg-surface-0`}
    >
      <div className={heroInnerStyles({ maxWidth, align })}>
        <HeroCopy
          actions={actions}
          align={align}
          eyebrow={eyebrow}
          eyebrowStyle={eyebrowStyle}
          headline={headline}
          subtitle={subtitle}
        />
      </div>

      <div
        aria-hidden={decorative ? 'true' : undefined}
        className="pointer-events-none absolute inset-0 z-0"
        data-testid="hero-video-backdrop"
      >
        {/*
          The scrim exists to hold text contrast over footage nobody validated. With no footage there
          is nothing to hold it against, and a strong scrim over the fallback field only flattens the
          band — measured at 1440 px, `strong` left the accent field invisible.
        */}
        {src === '' ? (
          <div className={HERO_VIDEO_FALLBACK} data-testid="hero-video-fallback" />
        ) : (
          // A track is rendered whenever the block is given one. Footage with neither a track nor
          // the decorative flag is what `heroVideoNeedsCaptions` reports to the export report — a
          // block cannot refuse to render while a user is halfway through configuring it.
          <video
            className={HERO_VIDEO_ELEMENT}
            data-testid="hero-video-element"
            loop
            muted
            playsInline
            poster={poster === '' ? undefined : poster}
            preload="metadata"
            ref={videoRef}
            src={src}
          >
            {captions !== '' && (
              <track default kind="captions" label="Captions" src={captions} srcLang="en" />
            )}
          </video>
        )}

        {src !== '' && (
          <div className={heroVideoScrimStyles({ scrim })} data-testid="hero-video-scrim" />
        )}
      </div>
    </section>
  )
}
