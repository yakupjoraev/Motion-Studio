import { ICON_REGISTRY, type IconName } from '@motion-studio/icons'

export interface NavIconProps {
  readonly name: string
  readonly size?: number
  readonly className?: string | undefined
}

/**
 * A glyph by name. A name the registry does not know draws nothing — the rule `content/badge` states,
 * and FILE_FORMAT.md § Security is why: a document's string never reaches module resolution.
 *
 * Always `aria-hidden`. Every call site in this category is an element that carries its own accessible
 * name, so a labelled glyph inside it would announce twice.
 */
export function NavIcon({ name, size = 18, className }: NavIconProps) {
  const Icon = ICON_REGISTRY[name as IconName]

  if (Icon === undefined) {
    return null
  }

  return <Icon aria-hidden="true" className={className} size={size} />
}
