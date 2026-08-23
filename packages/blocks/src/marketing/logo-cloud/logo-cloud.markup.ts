import { children, defineMarkup, el } from '@motion-studio/schema'

import { marketingSectionMarkup } from '../marketing-section.markup'
import { marqueeRowMarkup, marqueeStylesMarkup } from '../marquee-row.markup'
import { marqueeRowStyles } from '../marquee.styles'

import { LOGO_MARQUEE_ITEM, logoGridStyles } from './logo-cloud.styles'
import type { LogoCloudProps } from './logo-cloud.types'
import { logoMarkMarkup } from './logo-mark.markup'

export const logoCloudMarkup = defineMarkup<LogoCloudProps>(
  ({
    props: {
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
    },
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      headingSize: 'md',
      hidden,
      padding: 'compact',
      wide: mode === 'marquee',
      children:
        mode === 'marquee'
          ? children(
              marqueeStylesMarkup(),
              el('div', {
                classNames: [marqueeRowStyles({ fadeEdges })],
                children: [
                  marqueeRowMarkup({
                    direction: 'left',
                    duration,
                    gapClass: 'gap-0',
                    pauseOnHover,
                    children: logos.map((entry) =>
                      el('span', {
                        classNames: [LOGO_MARQUEE_ITEM],
                        children: [logoMarkMarkup(entry, grayscale)],
                      }),
                    ),
                  }),
                ],
              }),
            )
          : [
              el('ul', {
                classNames: [logoGridStyles({ columns: columns as 2 | 3 | 4 | 5 | 6 })],
                children: logos.map((entry) =>
                  el('li', { children: [logoMarkMarkup(entry, grayscale)] }),
                ),
              }),
            ],
    }),
)
