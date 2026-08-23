import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'

import type { Logo } from './logo-cloud.schema'
import { logoAlt } from './logo-cloud.schema'
import { LOGO_BOX, logoImageStyles, logoWordStyles } from './logo-cloud.styles'

/** A mark, as a word or as a picture. */
export const logoMarkMarkup = (entry: Logo, grayscale: boolean): MarkupElement =>
  el('span', {
    classNames: [LOGO_BOX],
    children: [
      entry.src === ''
        ? el('span', { classNames: [logoWordStyles({ grayscale })], children: [txt(entry.label)] })
        : el('img', {
            classNames: [logoImageStyles({ grayscale })],
            attributes: {
              alt: literal(logoAlt(entry)),
              decoding: literal('async'),
              height: literal(32),
              loading: literal('lazy'),
              src: literal(entry.src),
              width: literal(140),
            },
          }),
    ],
  })
