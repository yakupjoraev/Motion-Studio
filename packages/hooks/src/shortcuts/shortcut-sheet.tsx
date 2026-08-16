import { useId, useMemo, useState } from 'react'

import { formatKeys } from './format-keys'
import { type Platform, currentPlatform } from './normalize-keys'
import { SHORTCUT_GROUPS, type Shortcut, type ShortcutRegistry } from './registry'
import { ShortcutRow } from './shortcut-row'

/**
 * `Mod+/`, generated from the registry — the only shortcut documentation that cannot go stale,
 * because it *is* the source data. SHORTCUTS.md § Reference sheet.
 *
 * The modal shell is the caller's: this package sits below `ui` in the dependency graph and cannot
 * import a dialog. It renders the contents, and `apps/web` puts them in one.
 */
export function ShortcutSheet<Ctx>({
  registry,
  context,
  platform = currentPlatform(),
}: {
  readonly registry: ShortcutRegistry<Ctx>
  readonly context: Ctx
  readonly platform?: Platform
}) {
  const [query, setQuery] = useState('')
  const searchId = useId()

  const groups = useMemo(
    () =>
      SHORTCUT_GROUPS.map((group) => ({
        group,
        shortcuts: registry.byGroup(group).filter((shortcut) => matches(shortcut, query, platform)),
      })).filter((entry) => entry.shortcuts.length > 0),
    [registry, query, platform],
  )

  return (
    <div className="flex max-h-[70vh] flex-col gap-3" data-testid="shortcut-sheet">
      <div className="flex flex-col gap-1">
        <label className="text-foreground-muted text-xs" htmlFor={searchId}>
          Search shortcuts
        </label>
        <input
          className="h-7 rounded-sm border border-border bg-surface-1 px-2 text-foreground text-xs outline-none focus-visible:border-accent"
          id={searchId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="undo, breakpoint, pan…"
          type="search"
          value={query}
        />
      </div>

      {groups.length === 0 ? (
        <p className="py-6 text-center text-foreground-subtle text-xs">
          No shortcut matches “{query}”.
        </p>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {groups.map(({ group, shortcuts }) => (
            <section key={group}>
              <h3 className="pb-1 font-medium text-[11px] text-foreground-subtle uppercase tracking-wide">
                {group}
              </h3>
              <ul className="divide-y divide-border-subtle">
                {shortcuts.map((shortcut) => (
                  <ShortcutRow
                    available={shortcut.when === undefined || shortcut.when(context)}
                    key={shortcut.id}
                    platform={platform}
                    shortcut={shortcut}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** Searching the displayed keys as well as the label, so "ctrl+z" and "undo" both find it. */
function matches<Ctx>(shortcut: Shortcut<Ctx>, query: string, platform: Platform): boolean {
  const trimmed = query.trim().toLowerCase()

  if (trimmed === '') {
    return true
  }

  const haystack = [
    shortcut.label,
    shortcut.group,
    formatKeys(shortcut.keys, platform),
    shortcut.keys,
    ...(shortcut.keywords ?? []),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(trimmed)
}
