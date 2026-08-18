import { ICON_REGISTRY, type IconName } from '@motion-studio/icons'

export interface ControlIconProps {
  readonly name: string
  readonly size: number
  readonly className?: string | undefined
}

/**
 * A glyph by name, for the six blocks in the category that take one.
 *
 * The name is looked up in the registry and never resolved as a module path — FILE_FORMAT.md § Security —
 * and a name the registry does not know draws nothing rather than throwing on a document somebody else
 * authored.
 *
 * Always `aria-hidden`: every call site is a control that carries its own accessible name, so a labelled
 * glyph inside one would announce twice.
 */
export function ControlIcon({ name, size, className }: ControlIconProps) {
  const Icon = ICON_REGISTRY[name as IconName]

  if (Icon === undefined) {
    return null
  }

  return <Icon aria-hidden="true" className={className} size={size} />
}
