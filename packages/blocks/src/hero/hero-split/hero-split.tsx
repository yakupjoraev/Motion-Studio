import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import {
  heroSplitFrameStyles,
  heroSplitGridStyles,
  heroSplitMediaStyles,
  heroSplitSurfaceStyles,
  heroSplitTextStyles,
} from './hero-split.styles'
import type { HeroSplitProps } from './hero-split.types'

/**
 * Text on one side, anything at all on the other. The `media` slot accepts `*`, so the second half
 * is whatever the user put there — an image block, a code block, a whole nested layout.
 *
 * **The LCP element is the headline until a user puts something larger in the slot**, and measured on
 * the stand the empty plate is already the larger box — 207 936 px² against 74 898 at 1440. What this
 * block owns rather than hopes for: the text column is first in the DOM, the plate reserves its box
 * through `aspect-ratio` so a slow child shifts nothing, and nothing the block itself draws is a
 * contentful paint. What goes in the slot is the user's, and ADR-120 records why that is the honest
 * boundary rather than a promise the block cannot keep — PERFORMANCE.md § Images.
 *
 * The slot arrives as `media` when the host renders by slot and as `children` when it renders
 * positionally; the canvas does the latter. Reading both keeps the block honest in either host.
 */
export function HeroSplit({
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
  reverse,
  ratio,
  mediaAspect,
  mediaFrame,
  media,
  children,
}: HeroSplitProps) {
  return (
    <section
      className={`${heroSectionStyles({ padding, minHeight, align: 'start', hidden })} ${heroSplitSurfaceStyles({ background })} justify-center`}
    >
      <div className={heroInnerStyles({ maxWidth, align: 'start' })}>
        <div className={heroSplitGridStyles({ ratio })}>
          <div className={heroSplitTextStyles({ reverse })}>
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

          <div className={heroSplitMediaStyles({ reverse })}>
            <div
              className={heroSplitFrameStyles({ mediaFrame, mediaAspect })}
              data-testid="hero-media"
            >
              {media ?? children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
