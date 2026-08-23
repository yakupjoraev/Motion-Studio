import { ICON_REGISTRY, type IconName } from '@motion-studio/icons'

import { BADGE_DOT, BADGE_ICON_PX, badgeIconStyles, badgeStyles } from './badge.styles'
import type { BadgeProps } from './badge.types'

/**
 * A pill: a label, an optional status dot, and an optional icon.
 *
 * The icon is looked up by *name*, never resolved as a module path — FILE_FORMAT.md § Security keeps
 * a document's strings out of module resolution — and a name the registry does not know renders
 * nothing rather than throwing on a document somebody else authored.
 */
export function Badge({ label, variant, size, dot, icon, hidden }: BadgeProps) {
  const Icon = ICON_REGISTRY[icon as IconName]

  return (
    <span className={badgeStyles({ variant, size, hidden })}>
      {dot && <span aria-hidden="true" className={BADGE_DOT} data-testid="badge-dot" />}
      {Icon !== undefined && (
        <Icon aria-hidden="true" className={badgeIconStyles({ size })} size={BADGE_ICON_PX[size]} />
      )}
      {label}
    </span>
  )
}
