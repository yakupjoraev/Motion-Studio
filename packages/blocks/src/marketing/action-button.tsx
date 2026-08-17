import { cn } from '@motion-studio/utils'

import type { Action } from './marketing.schema'
import { actionOnAccentStyles, actionStyles } from './marketing.styles'

export interface ActionButtonProps {
  readonly action: Action
  /** The band behind it is the accent colour, so the variants invert. */
  readonly onAccent?: boolean
}

/**
 * One call to action.
 *
 * An action with an `href` is an `<a>` and one without is a `<button>`, and that is not cosmetic: a link
 * the keyboard activates with Enter and a button it activates with Space are different promises, and only
 * the element tells a reader which they are looking at.
 */
export function ActionButton({ action, onAccent = false }: ActionButtonProps) {
  const className = cn(
    actionStyles({ variant: action.variant }),
    onAccent && actionOnAccentStyles({ variant: action.variant }),
  )

  if (action.href === '') {
    return (
      <button className={className} data-testid="action-button" type="button">
        {action.label}
      </button>
    )
  }

  return (
    <a className={className} data-testid="action-button" href={action.href}>
      {action.label}
    </a>
  )
}
