'use client'

import { FOCUS_RING } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import type { ReactElement } from 'react'

export interface FilterChip {
  readonly id: string
  readonly label: string
  readonly count: number
}

export interface FilterChipsProps {
  readonly chips: readonly FilterChip[]
  readonly selected: ReadonlySet<string>
  readonly onToggle: (id: string) => void
  /** Names the group for a screen reader — "Block categories", "Motion channels". */
  readonly label: string
  readonly testId?: string
}

const CHIP_CLASS =
  'rounded-full border px-2 py-0.5 text-[10px] transition-colors aria-pressed:border-accent aria-pressed:bg-accent-muted aria-pressed:text-foreground'

/**
 * The secondary navigation every catalogue tab wears: multi-select chips with counts, over a grid
 * that is already visible — ADR-355.
 *
 * One component rather than one per tab, because the panel's tabs are peers: a user who has learned
 * the chips on Blocks should not meet a different filter on Motion. `aria-pressed` toggles rather
 * than a checkbox group, since these filter a visible grid rather than submitting anything.
 *
 * A chip with no items behind it is not drawn — a filter that can only empty the grid is not a filter.
 */
export function FilterChips({
  chips,
  selected,
  onToggle,
  label,
  testId,
}: FilterChipsProps): ReactElement {
  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and its `min-width: min-content` breaks the panel's wrapping row of chips.
      role="group"
      aria-label={label}
      className="flex flex-wrap gap-1"
      data-testid={testId}
    >
      {chips.map((chip) =>
        chip.count === 0 ? null : (
          <button
            aria-pressed={selected.has(chip.id)}
            className={cn(
              CHIP_CLASS,
              FOCUS_RING,
              selected.has(chip.id) ? 'text-foreground' : 'border-border text-foreground-muted',
            )}
            key={chip.id}
            onClick={() => onToggle(chip.id)}
            type="button"
          >
            {chip.label} <span className="text-foreground-subtle">{chip.count}</span>
          </button>
        ),
      )}
    </div>
  )
}
