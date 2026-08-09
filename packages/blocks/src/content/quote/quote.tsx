import { QuoteAttribution } from './quote-attribution'
import { QUOTE_GLYPH, quoteStyles, quoteTextStyles } from './quote.styles'
import type { QuoteProps } from './quote.types'

/**
 * A `<figure>` wrapping a `<blockquote>` and a `<figcaption>`, which is the markup a quotation with an
 * attribution actually has.
 */
export function Quote({ quote, author, role, avatar, size, mark, align, hidden }: QuoteProps) {
  return (
    <figure className={quoteStyles({ mark, align, hidden })}>
      {mark === 'glyph' && (
        <span aria-hidden="true" className={QUOTE_GLYPH} data-testid="quote-glyph">
          &ldquo;
        </span>
      )}

      <blockquote className={quoteTextStyles({ size })} data-testid="quote-text">
        {quote}
      </blockquote>

      <QuoteAttribution author={author} avatar={avatar} role={role} />
    </figure>
  )
}
