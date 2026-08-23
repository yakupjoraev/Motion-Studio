import { children, defineMarkup, el, txt } from '@motion-studio/schema'

import { actionButtonMarkup } from '../action-button.markup'
import { MARKETING_INNER, actionRowStyles, marketingSectionStyles } from '../marketing.styles'
import { newsletterFieldMarkup } from '../newsletter-form/newsletter-field.markup'
import { sectionHeadingMarkup } from '../section-heading.markup'

import {
  CTA_SPLIT_COPY,
  CTA_SPLIT_DESCRIPTION,
  CTA_SPLIT_EYEBROW,
  CTA_SPLIT_GRID,
  CTA_SPLIT_HEADING,
  CTA_SPLIT_SIDE,
  ctaSplitPanelStyles,
} from './cta-split.styles'
import type { CtaSplitProps } from './cta-split.types'

export const ctaSplitMarkup = defineMarkup<CtaSplitProps>(
  ({
    props: {
      eyebrow,
      heading,
      description,
      headingLevel,
      side,
      surface,
      actions,
      hidden,
      label,
      showLabel,
      placeholder,
      submitLabel,
      invalidMessage,
      successMessage,
      errorMessage,
      note,
    },
    id,
  }) =>
    el('section', {
      classNames: [marketingSectionStyles({ hidden, padding: 'compact' })],
      children: [
        el('div', {
          classNames: [MARKETING_INNER],
          children: [
            el('div', {
              classNames: [ctaSplitPanelStyles({ surface })],
              children: [
                el('div', {
                  classNames: [CTA_SPLIT_GRID],
                  children: [
                    el('div', {
                      classNames: [CTA_SPLIT_COPY],
                      children: children(
                        eyebrow !== '' &&
                          el('p', { classNames: [CTA_SPLIT_EYEBROW], children: [txt(eyebrow)] }),
                        heading !== '' &&
                          sectionHeadingMarkup({
                            className: CTA_SPLIT_HEADING,
                            level: headingLevel,
                            children: [txt(heading)],
                          }),
                        description !== '' &&
                          el('p', {
                            classNames: [CTA_SPLIT_DESCRIPTION],
                            children: [txt(description)],
                          }),
                      ),
                    }),
                    el('div', {
                      classNames: [CTA_SPLIT_SIDE],
                      children: [
                        side === 'form'
                          ? newsletterFieldMarkup({
                              errorMessage,
                              id,
                              invalidMessage,
                              label,
                              note,
                              placeholder,
                              showLabel,
                              submitLabel,
                              successMessage,
                            })
                          : el('div', {
                              classNames: [actionRowStyles({ align: 'start' })],
                              children: actions.map((action) => actionButtonMarkup({ action })),
                            }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
)
