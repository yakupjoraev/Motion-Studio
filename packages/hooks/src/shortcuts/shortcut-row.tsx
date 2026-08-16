import type { Platform } from './normalize-keys'
import type { Shortcut } from './registry'
import { ShortcutKeys } from './shortcut-keys'

/**
 * A row of the reference sheet. `available` is the evaluated `when` — an unavailable shortcut is
 * shown rather than hidden, because "why is nothing happening" is answered by seeing it greyed.
 */
export function ShortcutRow<Ctx>({
  shortcut,
  available,
  platform,
}: {
  readonly shortcut: Shortcut<Ctx>
  readonly available: boolean
  readonly platform: Platform
}) {
  return (
    <li
      aria-disabled={available ? undefined : true}
      className="flex items-center justify-between gap-4 py-1"
      data-available={available}
      data-testid="shortcut-row"
    >
      <span className={available ? 'text-foreground text-xs' : 'text-foreground-subtle text-xs'}>
        {shortcut.label}
      </span>
      <ShortcutKeys keys={shortcut.keys} platform={platform} />
    </li>
  )
}
