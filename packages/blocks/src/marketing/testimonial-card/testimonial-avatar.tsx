import { TESTIMONIAL_AVATAR, TESTIMONIAL_INITIAL } from './testimonial-card.styles'

export interface TestimonialAvatarProps {
  readonly src: string
  readonly author: string
}

/**
 * The face, or the initial standing in for one.
 *
 * Both are decorative: the name is text beside them, so a description would be announced twice. An empty
 * `src` draws the initial rather than a broken image — the state a testimonial spends most of its life in
 * while somebody is still finding the photo.
 */
export function TestimonialAvatar({ src, author }: TestimonialAvatarProps) {
  if (src !== '') {
    return (
      <img
        alt=""
        className={TESTIMONIAL_AVATAR}
        data-testid="testimonial-avatar"
        decoding="async"
        height={40}
        loading="lazy"
        src={src}
        width={40}
      />
    )
  }

  const initial = author.trim().charAt(0).toUpperCase()

  if (initial === '') {
    return null
  }

  return (
    <span aria-hidden="true" className={TESTIMONIAL_INITIAL} data-testid="testimonial-initial">
      {initial}
    </span>
  )
}
