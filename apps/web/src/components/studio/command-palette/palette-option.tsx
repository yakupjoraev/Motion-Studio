'use client'

import { ShortcutKeys } from '@motion-studio/hooks'
import { memo } from 'react'

import type { PaletteItem } from './use-palette-items'

export interface PaletteOptionProps {
  readonly item: PaletteItem
  readonly active: boolean
  readonly index: number
  readonly setSize: number
  readonly top: number
  readonly height: number
  readonly onPick: (item: PaletteItem) => void
}

/**
 * One row. `aria-setsize` and `aria-posinset` carry the *full* list rather than the rendered window,
 * which is the part a virtualized listbox usually gets wrong — a screen reader would otherwise
 * announce "1 of 12" on a list of three hundred.
 */
export const PaletteOption = memo(function PaletteOption({
  item,
  active,
  index,
  setSize,
  top,
  height,
  onPick,
}: PaletteOptionProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the listbox owns the keyboard; an option inside it is not a tab stop
    // biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant keeps focus on the input, which is what makes the option not a tab stop
    <div
      aria-disabled={item.available ? undefined : true}
      aria-posinset={index + 1}
      aria-selected={active}
      aria-setsize={setSize}
      className={`absolute inset-x-0 flex cursor-default items-center justify-between gap-3 px-3 text-xs ${
        active ? 'bg-accent-muted text-foreground' : 'text-foreground-muted'
      }`}
      data-testid="palette-option"
      id={`palette-option-${item.id}`}
      onClick={() => onPick(item)}
      // biome-ignore lint/a11y/useSemanticElements: an <option> cannot carry a group column and a key hint
      role="option"
      style={{ top, height }}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="w-16 shrink-0 text-[10px] text-foreground-subtle uppercase tracking-wide">
          {item.group}
        </span>
        <span className={`truncate ${item.available ? '' : 'opacity-50'}`}>{item.label}</span>
      </span>
      {item.shortcut === undefined ? null : <ShortcutKeys keys={item.shortcut} />}
    </div>
  )
})
