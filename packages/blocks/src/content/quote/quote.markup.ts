import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { quoteAttributionMarkup } from './quote-attribution.markup'
import { QUOTE_GLYPH, quoteStyles, quoteTextStyles } from './quote.styles'
import type { QuoteProps } from './quote.types'

/** The opening quotation mark the component writes as `&ldquo;`. */
const LEFT_DOUBLE_QUOTE = '“'

export const quoteMarkup = defineMarkup<QuoteProps>(
  ({ props: { quote, author, role, avatar, size, mark, align, hidden } }) =>
    el('figure', {
      classNames: [quoteStyles({ mark, align, hidden })],
      children: children(
        mark === 'glyph' &&
          el('span', {
            classNames: [QUOTE_GLYPH],
            attributes: { 'aria-hidden': literal(true) },
            children: [txt(LEFT_DOUBLE_QUOTE)],
          }),
        el('blockquote', { classNames: [quoteTextStyles({ size })], children: [txt(quote)] }),
        quoteAttributionMarkup({ author, avatar, role }),
      ),
    }),
)
