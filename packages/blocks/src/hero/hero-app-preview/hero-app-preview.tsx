import type { CSSProperties } from 'react'

import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import {
  HERO_PREVIEW_FRAME,
  HERO_PREVIEW_GLOW,
  HERO_PREVIEW_IMAGE,
  HERO_PREVIEW_TILT,
  PLACEHOLDER_BAR,
  PLACEHOLDER_BODY,
  PLACEHOLDER_CANVAS,
  PLACEHOLDER_DOT,
  PLACEHOLDER_NODE,
  PLACEHOLDER_ROW,
  PLACEHOLDER_SIDEBAR,
  heroAppPreviewSurfaceStyles,
} from './hero-app-preview.styles'
import type { HeroAppPreviewProps } from './hero-app-preview.types'

const SIDEBAR_ROWS = ['w-4/5', 'w-full', 'w-3/5', 'w-2/3'] as const

/**
 * Text beside a perspective-tilted screenshot with an accent glow behind it.
 *
 * **This is the one hero whose LCP element is not the headline, and pretending otherwise would be a
 * lie the numbers refute.** Measured on the six-hero stand: the plate is 218 597 px² against the
 * headline's 112 347 px² at 1440, and 102 289 against 25 005 at 412 — a screenshot beside a column of
 * type is simply the larger thing at every width. So the block does the two things that actually
 * protect the metric instead: the image is `eager` and `fetchPriority="high"` so it is requested with
 * the document rather than after it, and its box is reserved from `imageWidth`/`imageHeight` so
 * nothing shifts when it lands. ADR-120 records the measurement. What *is* guaranteed here, as in
 * every other hero, is that no decoration this block draws can win LCP: a `radial-gradient` is not a
 * contentful paint, so the glow is not a candidate at any size.
 *
 * See ADR-119 for why the image is an `<img>` and not `next/image`.
 *
 * With no screenshot the block renders a window in surface tokens instead. That is not a placeholder
 * in the apologetic sense — it is the default state of the block, and a hero whose default state is a
 * grey rectangle would fail the premise this whole category is testing.
 *
 * Design reference: impeccable.style — the tilted product shot. Technique: a single rotation on two
 * axes with the perspective on the transform itself rather than on the parent, and the accent glow
 * *behind the plate* rather than behind the section, which is what stops a tilt reading as a sticker.
 */
export function HeroAppPreview({
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
  background,
  image,
  imageWidth,
  imageHeight,
  tiltX,
  tiltY,
  perspective,
  glow,
}: HeroAppPreviewProps) {
  const tilt = {
    '--ms-tilt-x': `${tiltX}deg`,
    '--ms-tilt-y': `${tiltY}deg`,
    '--ms-tilt-perspective': `${perspective}px`,
  } as CSSProperties

  return (
    <section
      className={`${heroSectionStyles({ padding, minHeight, align: 'start', hidden })} ${heroAppPreviewSurfaceStyles({ background })} justify-center`}
    >
      <div className={heroInnerStyles({ maxWidth, align: 'start' })}>
        <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <HeroCopy
              actions={actions}
              align={align}
              eyebrow={eyebrow}
              eyebrowStyle={eyebrowStyle}
              headline={headline}
              subtitle={subtitle}
              headlineSize="display-2"
              subtitleSize="md"
            />
          </div>

          <div className="relative min-w-0">
            <div className={HERO_PREVIEW_TILT} data-testid="hero-preview-tilt" style={tilt}>
              <div className={HERO_PREVIEW_FRAME}>
                {image.src === '' ? (
                  <div aria-hidden="true" data-testid="hero-preview-placeholder">
                    <div className={PLACEHOLDER_BAR}>
                      <span className={PLACEHOLDER_DOT} />
                      <span className={PLACEHOLDER_DOT} />
                      <span className={PLACEHOLDER_DOT} />
                    </div>
                    <div className={PLACEHOLDER_BODY}>
                      <div className={PLACEHOLDER_SIDEBAR}>
                        {SIDEBAR_ROWS.map((width) => (
                          <span className={`${PLACEHOLDER_ROW} ${width}`} key={width} />
                        ))}
                      </div>
                      <div className={PLACEHOLDER_CANVAS}>
                        <span className={PLACEHOLDER_NODE} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    alt={image.alt}
                    className={HERO_PREVIEW_IMAGE}
                    data-testid="hero-preview-image"
                    decoding="async"
                    fetchPriority="high"
                    height={imageHeight}
                    loading="eager"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    src={image.src}
                    width={imageWidth}
                  />
                )}
              </div>
            </div>

            {glow && (
              <div
                aria-hidden="true"
                className={HERO_PREVIEW_GLOW}
                data-testid="hero-preview-glow"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
