import { TestimonialAttribution } from './testimonial-attribution'
import {
  TESTIMONIAL_EYEBROW,
  TESTIMONIAL_LOGO,
  TESTIMONIAL_QUOTE,
  testimonialCardStyles,
} from './testimonial-card.styles'
import type { TestimonialCardProps } from './testimonial-card.types'

/**
 * One testimonial: a mark, a quote, and who said it.
 *
 * A `<figure>` around a `<blockquote>` and a `<figcaption>`, which is the markup a quotation with an
 * attribution has. The logo is a real `<img>` with its own alt, because a company mark is content — a
 * reader who cannot see it still wants to know whose testimonial this is.
 */
export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatar,
  logo,
  logoAlt,
  treatment,
  eyebrow,
  hidden,
}: TestimonialCardProps) {
  return (
    <figure className={testimonialCardStyles({ treatment, hidden })} data-testid="testimonial-card">
      {eyebrow !== '' && <p className={TESTIMONIAL_EYEBROW}>{eyebrow}</p>}

      {logo !== '' && (
        <img
          alt={logoAlt}
          className={TESTIMONIAL_LOGO}
          data-testid="testimonial-logo"
          decoding="async"
          height={24}
          loading="lazy"
          src={logo}
          width={140}
        />
      )}

      <blockquote className={TESTIMONIAL_QUOTE} data-testid="testimonial-quote">
        {quote}
      </blockquote>

      <TestimonialAttribution author={author} avatar={avatar} company={company} role={role} />
    </figure>
  )
}
