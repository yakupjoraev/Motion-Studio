'use client'

import { BLOCK_CATEGORIES, type BlockCategory } from '@motion-studio/schema'

export interface CategoryChipsProps {
  readonly counts: Readonly<Record<string, number>>
  readonly selected: ReadonlySet<BlockCategory>
  readonly onChange: (next: ReadonlySet<BlockCategory>) => void
}

const CATEGORIES = Object.keys(BLOCK_CATEGORIES) as readonly BlockCategory[]

/**
 * The nine categories of COMPONENT_LIBRARY.md § Catalogue as toggles. `aria-pressed` rather than a
 * checkbox group: each chip is a switch on the grid beside it, and a screen reader that says
 * "Effects, pressed" has said the whole state.
 */
export function CategoryChips({ counts, selected, onChange }: CategoryChipsProps) {
  const toggle = (category: BlockCategory): void => {
    const next = new Set(selected)

    if (!next.delete(category)) {
      next.add(category)
    }

    onChange(next)
  }

  return (
    /* One line that scrolls rather than a row that wraps: a wrapping row re-wraps when Geist Mono
       replaces its fallback, which is 0.026 of a 0.02 CLS budget and the same defect ADR-295 found
       in the landing page's stat row. A row that cannot wrap cannot re-wrap. */
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {CATEGORIES.map((category) => {
        const on = selected.has(category)

        return (
          <button
            aria-pressed={on}
            className={`shrink-0 rounded-full border px-3 py-1 font-mono text-2xs uppercase tracking-[0.14em] outline-none transition-colors focus-visible:shadow-focus ${
              on
                ? 'border-accent bg-accent-muted text-foreground'
                : 'border-border bg-surface-1 text-foreground-muted hover:text-foreground'
            }`}
            key={category}
            onClick={() => toggle(category)}
            type="button"
          >
            {BLOCK_CATEGORIES[category]}
            <span className="ml-1.5 tabular-nums">{counts[category] ?? 0}</span>
          </button>
        )
      })}
    </div>
  )
}
