import { MarketingSection } from '../marketing-section'
import { MarqueeRow } from '../marquee-row'
import { MarqueeStyles } from '../marquee-styles'
import { marqueeRowStyles } from '../marquee.styles'

import { LOGO_MARQUEE_ITEM, logoGridStyles } from './logo-cloud.styles'
import type { LogoCloudProps } from './logo-cloud.types'
import { LogoMark } from './logo-mark'

/**
 * A row of company marks, as a grid or as one scrolling track.
 *
 * Marquee mode is the `marquee` preset (ADR-186) — the same class, custom properties and stylesheet
 * `testimonial-marquee` uses, and the same reduced-motion fallback in `blocks.css`, which turns the track
 * into a wrapping centred row. That fallback is what makes reduced motion look intentional here rather
 * than like a grid that lost its animation: a centred row of marks is exactly what grid mode draws.
 */
export function LogoCloud({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  mode,
  columns,
  grayscale,
  duration,
  pauseOnHover,
  fadeEdges,
  logos,
  hidden,
}: LogoCloudProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }

  return (
    <MarketingSection
      copy={copy}
      headingSize="md"
      hidden={hidden}
      padding="compact"
      testId="logo-cloud"
      wide={mode === 'marquee'}
    >
      {mode === 'marquee' ? (
        <>
          <MarqueeStyles />
          <div className={marqueeRowStyles({ fadeEdges })}>
            <MarqueeRow
              direction="left"
              duration={duration}
              gapClass="gap-0"
              pauseOnHover={pauseOnHover}
            >
              {logos.map((entry, index) => (
                <span className={LOGO_MARQUEE_ITEM} key={`${entry.label}-${index}`}>
                  <LogoMark entry={entry} grayscale={grayscale} />
                </span>
              ))}
            </MarqueeRow>
          </div>
        </>
      ) : (
        <ul className={logoGridStyles({ columns: columns as 2 | 3 | 4 | 5 | 6 })}>
          {logos.map((entry, index) => (
            <li key={`${entry.label}-${index}`}>
              <LogoMark entry={entry} grayscale={grayscale} />
            </li>
          ))}
        </ul>
      )}
    </MarketingSection>
  )
}
