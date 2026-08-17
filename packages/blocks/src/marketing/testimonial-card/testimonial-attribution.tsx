import { TestimonialAvatar } from './testimonial-avatar'
import { attributionLine } from './testimonial-card.schema'
import { TESTIMONIAL_AUTHOR, TESTIMONIAL_FOOTER, TESTIMONIAL_ROLE } from './testimonial-card.styles'

export interface TestimonialAttributionProps {
  readonly author: string
  readonly role: string
  readonly company: string
  readonly avatar: string
}

/**
 * Who said it — a `<figcaption>`, outside the `<blockquote>` the way `content/quote` puts it, so a screen
 * reader does not read the name as part of what the person said. Nobody credited renders nothing rather
 * than an empty row.
 */
export function TestimonialAttribution({
  author,
  role,
  company,
  avatar,
}: TestimonialAttributionProps) {
  const line = attributionLine(role, company)

  if (author === '' && line === '') {
    return null
  }

  return (
    <figcaption className={TESTIMONIAL_FOOTER}>
      <TestimonialAvatar author={author} src={avatar} />

      <span className="flex min-w-0 flex-col">
        {author !== '' && <span className={TESTIMONIAL_AUTHOR}>{author}</span>}
        {line !== '' && <span className={TESTIMONIAL_ROLE}>{line}</span>}
      </span>
    </figcaption>
  )
}
