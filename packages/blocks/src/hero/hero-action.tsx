import type { Cta } from './hero.schema'
import { heroActionStyles } from './hero.styles'

export interface HeroActionProps {
  readonly action: Cta
}

/**
 * One call to action.
 *
 * A CTA with an `href` is an `<a>` and one without is a `<button>`, and that is not cosmetic: a link
 * the keyboard activates with Enter and a button it activates with Space are different promises, and
 * only the element tells a user which they are looking at.
 */
export function HeroAction({ action }: HeroActionProps) {
  const className = heroActionStyles({ variant: action.variant })

  if (action.href === '') {
    return (
      <button className={className} type="button">
        {action.label}
      </button>
    )
  }

  return (
    <a className={className} href={action.href}>
      {action.label}
    </a>
  )
}
