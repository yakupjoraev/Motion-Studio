import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import { QUOTE_AUTHOR, QUOTE_AVATAR, QUOTE_FOOTER, QUOTE_INITIAL, QUOTE_ROLE } from './quote.styles'

export interface QuoteAttributionMarkupInput {
  readonly author: string
  readonly role: string
  readonly avatar: string
}

/** `QuoteAttribution` as markup: nobody credited renders nothing rather than an empty row. */
export function quoteAttributionMarkup({
  author,
  role,
  avatar,
}: QuoteAttributionMarkupInput): MarkupElement | null {
  if (author === '' && role === '') {
    return null
  }

  const initial = author.trim().charAt(0).toUpperCase()

  return el('figcaption', {
    classNames: [QUOTE_FOOTER],
    children: children(
      avatar === ''
        ? initial !== '' &&
            el('span', {
              classNames: [QUOTE_INITIAL],
              attributes: { 'aria-hidden': literal(true) },
              children: [txt(initial)],
            })
        : el('img', {
            classNames: [QUOTE_AVATAR],
            attributes: {
              alt: literal(''),
              decoding: literal('async'),
              height: literal(40),
              loading: literal('lazy'),
              src: literal(avatar),
              width: literal(40),
            },
          }),
      el('span', {
        classNames: ['flex flex-col'],
        children: children(
          author !== '' && el('span', { classNames: [QUOTE_AUTHOR], children: [txt(author)] }),
          role !== '' && el('span', { classNames: [QUOTE_ROLE], children: [txt(role)] }),
        ),
      }),
    ),
  })
}
