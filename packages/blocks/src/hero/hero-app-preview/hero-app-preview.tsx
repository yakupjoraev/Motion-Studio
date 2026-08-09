import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { HERO_PREVIEW_GLOW, heroAppPreviewSurfaceStyles } from './hero-app-preview.styles'
import type { HeroAppPreviewProps } from './hero-app-preview.types'
import { PreviewPlate } from './preview-plate'

/**
 * Text beside a perspective-tilted screenshot with an accent glow behind it.
 *
 * **This is the one hero whose LCP element is not the headline, and pretending otherwise would be a
 * lie the numbers refute.** Measured on the six-hero stand: the plate is 218 597 px² against the
 * headline's 112 347 px² at 1440, and 102 289 against 25 005 at 412 — a screenshot beside a column of
 * type is simply the larger thing at every width. So the block does the two things that actually
 * protect the metric instead: the image is requested with the document, and its box is reserved from
 * explicit dimensions so nothing shifts when it lands. ADR-120 records the measurement. What *is*
 * guaranteed, as in every other hero, is that no decoration this block draws can win LCP: a
 * `radial-gradient` is not a contentful paint, so the glow is not a candidate at any size.
 *
 * See ADR-119 for why the image is an `<img>` and not `next/image`.
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
              headlineSize="display-2"
              subtitle={subtitle}
              subtitleSize="md"
            />
          </div>

          <div className="relative min-w-0">
            <PreviewPlate
              height={imageHeight}
              image={image}
              perspective={perspective}
              tiltX={tiltX}
              tiltY={tiltY}
              width={imageWidth}
            />

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
