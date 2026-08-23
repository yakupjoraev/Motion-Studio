import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { attributionLine } from './testimonial-card.schema'
import {
  TESTIMONIAL_AUTHOR,
  TESTIMONIAL_AVATAR,
  TESTIMONIAL_EYEBROW,
  TESTIMONIAL_FOOTER,
  TESTIMONIAL_INITIAL,
  TESTIMONIAL_LOGO,
  TESTIMONIAL_QUOTE,
  TESTIMONIAL_ROLE,
  testimonialCardStyles,
} from './testimonial-card.styles'
import type { TestimonialCardProps } from './testimonial-card.types'

/** A picture, or the first letter of the name, or nothing at all. */
const avatarMarkup = (src: string, author: string): MarkupElement | null => {
  if (src !== '') {
    return el('img', {
      classNames: [TESTIMONIAL_AVATAR],
      attributes: {
        alt: literal(''),
        decoding: literal('async'),
        height: literal(40),
        loading: literal('lazy'),
        src: literal(src),
        width: literal(40),
      },
    })
  }

  const initial = author.trim().charAt(0).toUpperCase()

  return initial === ''
    ? null
    : el('span', {
        classNames: [TESTIMONIAL_INITIAL],
        attributes: { 'aria-hidden': literal('true') },
        children: [txt(initial)],
      })
}

export const attributionMarkup = (
  author: string,
  role: string,
  company: string,
  avatar: string,
): MarkupElement | null => {
  const line = attributionLine(role, company)

  if (author === '' && line === '') {
    return null
  }

  return el('figcaption', {
    classNames: [TESTIMONIAL_FOOTER],
    children: children(
      avatarMarkup(avatar, author),
      el('span', {
        classNames: ['flex min-w-0 flex-col'],
        children: children(
          author !== '' &&
            el('span', { classNames: [TESTIMONIAL_AUTHOR], children: [txt(author)] }),
          line !== '' && el('span', { classNames: [TESTIMONIAL_ROLE], children: [txt(line)] }),
        ),
      }),
    ),
  })
}

export const testimonialCardMarkup = defineMarkup<TestimonialCardProps>(
  ({
    props: { quote, author, role, company, avatar, logo, logoAlt, treatment, eyebrow, hidden },
  }) =>
    el('figure', {
      classNames: [testimonialCardStyles({ treatment, hidden })],
      children: children(
        eyebrow !== '' && el('p', { classNames: [TESTIMONIAL_EYEBROW], children: [txt(eyebrow)] }),
        logo !== '' &&
          el('img', {
            classNames: [TESTIMONIAL_LOGO],
            attributes: {
              alt: literal(logoAlt),
              decoding: literal('async'),
              height: literal(24),
              loading: literal('lazy'),
              src: literal(logo),
              width: literal(140),
            },
          }),
        el('blockquote', { classNames: [TESTIMONIAL_QUOTE], children: [txt(quote)] }),
        attributionMarkup(author, role, company, avatar),
      ),
    }),
)
