import { QUOTE_AUTHOR, QUOTE_AVATAR, QUOTE_FOOTER, QUOTE_INITIAL, QUOTE_ROLE } from './quote.styles'

export interface QuoteAttributionProps {
  readonly author: string
  readonly role: string
  readonly avatar: string
}

/**
 * Who said it. A `<figcaption>`, deliberately outside the `<blockquote>`: the attribution is *about*
 * the quote and is not part of it, so a screen reader must not read the name as something the person
 * said. With nobody credited it renders nothing rather than an empty row.
 */
export function QuoteAttribution({ author, role, avatar }: QuoteAttributionProps) {
  if (author === '' && role === '') {
    return null
  }

  const initial = author.trim().charAt(0).toUpperCase()

  return (
    <figcaption className={QUOTE_FOOTER}>
      {avatar === '' ? (
        initial !== '' && (
          <span aria-hidden="true" className={QUOTE_INITIAL} data-testid="quote-initial">
            {initial}
          </span>
        )
      ) : (
        // Decorative: the name is already text beside it, so a description would be said twice.
        <img
          alt=""
          className={QUOTE_AVATAR}
          data-testid="quote-avatar"
          decoding="async"
          height={40}
          loading="lazy"
          src={avatar}
          width={40}
        />
      )}
      <span className="flex flex-col">
        {author !== '' && <span className={QUOTE_AUTHOR}>{author}</span>}
        {role !== '' && <span className={QUOTE_ROLE}>{role}</span>}
      </span>
    </figcaption>
  )
}
