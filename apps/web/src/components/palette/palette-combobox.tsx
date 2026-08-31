'use client'

import type { ReactNode, Ref } from 'react'

export interface PaletteComboboxProps {
  readonly inputLabel: string
  readonly placeholder: string
  readonly query: string
  readonly setQuery: (value: string) => void
  readonly listLabel: string
  readonly listId: string
  readonly listHeight: number
  readonly listRef?: Ref<HTMLDivElement>
  readonly count: number
  readonly active: number
  readonly setActive: (index: number) => void
  readonly onPick: (index: number) => void
  readonly activeOptionId: string | undefined
  readonly inputTestId: string
  readonly listTestId: string
  readonly empty: ReactNode
  readonly children: ReactNode
}

/**
 * The combobox both `⌘K` surfaces are: focus stays in the field, the active option is named by
 * `aria-activedescendant`, the arrows move it, `Tab` does nothing because the dialog is modal, and
 * `Enter` commits — ADR-310. Rows and their ordering belong to the caller.
 */
export function PaletteCombobox({
  inputLabel,
  placeholder,
  query,
  setQuery,
  listLabel,
  listId,
  listHeight,
  listRef,
  count,
  active,
  setActive,
  onPick,
  activeOptionId,
  inputTestId,
  listTestId,
  empty,
  children,
}: PaletteComboboxProps) {
  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Tab') {
      event.preventDefault()

      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(Math.min(active + 1, count - 1))
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(Math.max(active - 1, 0))
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      onPick(active)
    }
  }

  return (
    <div className="flex flex-col gap-2" data-shortcut-scope="dialog">
      <input
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded
        aria-label={inputLabel}
        autoComplete="off"
        // biome-ignore lint/a11y/noAutofocus: a modal search field is the case the rule exempts — the palette exists to be typed into
        autoFocus
        className="h-9 w-full rounded-sm border border-border bg-surface-1 px-3 text-foreground text-sm outline-none focus-visible:border-accent"
        data-testid={inputTestId}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        value={query}
      />

      {/* biome-ignore lint/a11y/useFocusableInteractive: the combobox keeps focus and points at the
          active option with aria-activedescendant, which is the pattern ACCESSIBILITY.md names */}
      <div
        aria-label={listLabel}
        className="relative overflow-y-auto"
        data-testid={listTestId}
        id={listId}
        ref={listRef}
        // biome-ignore lint/a11y/useSemanticElements: a <select> cannot hold virtualized rows or a shortcut column
        role="listbox"
        style={{ height: listHeight }}
      >
        {children}

        {count === 0 && empty}
      </div>
    </div>
  )
}
