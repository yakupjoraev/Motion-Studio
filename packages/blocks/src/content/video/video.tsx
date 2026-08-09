'use client'

import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '../../reduced-motion'

import { effectiveMuted } from './video.schema'
import {
  VIDEO_CAPTION,
  VIDEO_ELEMENT,
  VIDEO_EMPTY,
  videoFigureStyles,
  videoFrameStyles,
} from './video.styles'
import type { VideoProps } from './video.types'

/**
 * A video file in a framed figure.
 *
 * Autoplay is the only interesting part, and it is handled the way `hero-video` handles it: no
 * `autoplay` attribute, playback started from an effect, and only when `--ms-reduced-motion` says
 * motion is allowed. One mechanism covers the media query, the studio's reduced-motion preview, and a
 * page with no JavaScript — all three land on the poster, which is why the poster matters.
 *
 * A video the user drives with controls is untouched by any of that: pressing play is motion somebody
 * asked for, and ANIMATION_SYSTEM.md's reduced-motion policy is about motion nobody asked for.
 */
export function Video({
  src,
  poster,
  captions,
  decorative,
  controls,
  autoplay,
  loop,
  muted,
  aspect,
  radius,
  caption,
  hidden,
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (video === null || src === '' || !autoplay) {
      return
    }

    if (prefersReducedMotion(video)) {
      return
    }

    Promise.resolve(video.play()).catch(() => undefined)
  }, [src, autoplay])

  return (
    <figure className={videoFigureStyles({ hidden })}>
      <div className={videoFrameStyles({ aspect, radius })}>
        {src === '' ? (
          <span className={VIDEO_EMPTY} data-testid="video-empty">
            No video yet
          </span>
        ) : (
          // A track is rendered whenever the block is given one. Footage with neither a track nor
          // the decorative flag is what `videoNeedsCaptions` reports to the export report — a block
          // cannot refuse to render while somebody is halfway through configuring it.
          <video
            aria-hidden={decorative && !controls ? 'true' : undefined}
            className={VIDEO_ELEMENT}
            controls={controls}
            data-testid="video-element"
            loop={loop}
            muted={effectiveMuted({ autoplay, muted })}
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
      </div>

      {caption !== '' && <figcaption className={VIDEO_CAPTION}>{caption}</figcaption>}
    </figure>
  )
}
