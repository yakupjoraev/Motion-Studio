import type { Action } from '../marketing/marketing.schema'

import { navActionStyles } from './navigation.styles'

export interface NavActionProps {
  readonly action: Action
}

/**
 * A call to action in a bar. Same data as a marketing action and the same element rule — an `href`
 * makes it a link, an empty one makes it a button, because Enter on a link and Space on a button are
 * different promises — at chrome geometry rather than content geometry.
 */
export function NavAction({ action }: NavActionProps) {
  const className = navActionStyles({ variant: action.variant })

  if (action.href === '') {
    return (
      <button className={className} data-testid="nav-action" type="button">
        {action.label}
      </button>
    )
  }

  return (
    <a className={className} data-testid="nav-action" href={action.href}>
      {action.label}
    </a>
  )
}
