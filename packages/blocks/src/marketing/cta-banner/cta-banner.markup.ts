import { children, defineMarkup, el, txt } from '@motion-studio/schema'

import { actionButtonMarkup } from '../action-button.markup'
import { MARKETING_INNER, actionRowStyles, marketingSectionStyles } from '../marketing.styles'
import { sectionHeadingMarkup } from '../section-heading.markup'

import { bandIsAccent } from './cta-banner.schema'
import {
  CTA_ACTIONS,
  ctaCopyStyles,
  ctaDescriptionStyles,
  ctaEyebrowStyles,
  ctaHeadingStyles,
  ctaPanelStyles,
} from './cta-banner.styles'
import type { CtaBannerProps } from './cta-banner.types'

export const ctaBannerMarkup = defineMarkup<CtaBannerProps>(
  ({ props: { eyebrow, heading, description, headingLevel, align, surface, actions, hidden } }) => {
    const onAccent = bandIsAccent(surface)

    return el('section', {
      classNames: [marketingSectionStyles({ hidden, padding: 'compact' })],
      children: [
        el('div', {
          classNames: [MARKETING_INNER],
          children: [
            el('div', {
              classNames: [ctaPanelStyles({ surface })],
              children: [
                el('div', {
                  classNames: [ctaCopyStyles({ align })],
                  children: children(
                    eyebrow !== '' &&
                      el('p', {
                        classNames: [ctaEyebrowStyles({ onAccent })],
                        children: [txt(eyebrow)],
                      }),
                    heading !== '' &&
                      sectionHeadingMarkup({
                        className: ctaHeadingStyles({ onAccent }),
                        level: headingLevel,
                        children: [txt(heading)],
                      }),
                    description !== '' &&
                      el('p', {
                        classNames: [ctaDescriptionStyles({ onAccent })],
                        children: [txt(description)],
                      }),
                    actions.length > 0 &&
                      el('div', {
                        classNames: [CTA_ACTIONS],
                        children: [
                          el('div', {
                            classNames: [actionRowStyles({ align })],
                            children: actions.map((action) =>
                              actionButtonMarkup({ action, onAccent }),
                            ),
                          }),
                        ],
                      }),
                  ),
                }),
              ],
            }),
          ],
        }),
      ],
    })
  },
)
