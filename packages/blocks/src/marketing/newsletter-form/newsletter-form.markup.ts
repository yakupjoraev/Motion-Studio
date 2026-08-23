import { children, defineMarkup, el, txt } from '@motion-studio/schema'

import { sectionHeadingMarkup } from '../section-heading.markup'

import { newsletterFieldMarkup } from './newsletter-field.markup'
import {
  NEWSLETTER_DESCRIPTION,
  NEWSLETTER_HEADING,
  newsletterStackStyles,
} from './newsletter-form.styles'
import type { NewsletterFormProps } from './newsletter-form.types'

export const newsletterFormMarkup = defineMarkup<NewsletterFormProps>(
  ({
    props: {
      heading,
      description,
      headingLevel,
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
    el('div', {
      classNames: [newsletterStackStyles({ hidden })],
      children: children(
        heading !== '' &&
          sectionHeadingMarkup({
            className: NEWSLETTER_HEADING,
            level: headingLevel,
            children: [txt(heading)],
          }),
        description !== '' &&
          el('p', { classNames: [NEWSLETTER_DESCRIPTION], children: [txt(description)] }),
        el('div', {
          classNames: ['mt-6'],
          children: [
            newsletterFieldMarkup({
              errorMessage,
              id,
              invalidMessage,
              label,
              note,
              placeholder,
              showLabel,
              submitLabel,
              successMessage,
            }),
          ],
        }),
      ),
    }),
)
