'use client'

import { Dialog } from '@motion-studio/ui'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import type { StudioShortcutContext } from '../shortcuts/shortcut.types'

import { fuzzyScore } from './fuzzy-match'
import { PaletteOption } from './palette-option'
import { type PaletteItem, usePaletteItems } from './use-palette-items'
import { useRecentItems } from './use-recent-items'

const ROW_HEIGHT = 32
const LIST_HEIGHT = 320

/**
 * `⌘K`. A combobox over one virtualized listbox — SHORTCUTS.md § Command palette, including the two
 * rules that are easy to miss: recent items come first whatever the score, and `Tab` does nothing, so
 * focus cannot leave a modal that owns the keyboard.
 */
export function CommandPalette({ context }: { readonly context: StudioShortcutContext }) {
  const setOpen = useStudioStore((state) => state.setCommandPaletteOpen)
  const items = usePaletteItems(context)
  const { recent, remember } = useRecentItems()

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const scored: { item: PaletteItem; score: number }[] = []

    for (const item of items) {
      const score = fuzzyScore(item, query)

      if (score !== null) {
        scored.push({ item, score })
      }
    }

    return scored
      .sort((a, b) => {
        const recency = recent.indexOf(b.item.id) - recent.indexOf(a.item.id)

        // `indexOf` is -1 for anything unseen, so this compares "how recent" and falls through to
        // the score when neither is in the list.
        return recency !== 0 && (recent.includes(a.item.id) || recent.includes(b.item.id))
          ? recency
          : b.score - a.score
      })
      .map((entry) => entry.item)
  }, [items, query, recent])

  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    // The list is a fixed height, so the first frame can render rows instead of waiting for the
    // element to be measured — which is also what the 50 ms open budget is spent on.
    initialRect: { width: 0, height: LIST_HEIGHT },
  })

  useEffect(() => {
    virtualizer.scrollToIndex(active)
  }, [active, virtualizer])

  const pick = (item: PaletteItem): void => {
    if (!item.available) {
      return
    }

    remember(item.id)
    setOpen(false)
    item.run()
  }

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Tab') {
      // The palette is modal: leaving it with Tab would put focus on the document behind it.
      event.preventDefault()

      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(current + 1, matches.length - 1))
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const item = matches[active]

      if (item !== undefined) {
        pick(item)
      }
    }
  }

  const activeItem = matches[active]

  return (
    <Dialog
      description="Search every command, block, preset, theme and layer."
      onOpenChange={setOpen}
      open
      size="lg"
      title="Command palette"
    >
      <div className="flex flex-col gap-2" data-shortcut-scope="dialog">
        <input
          aria-activedescendant={
            activeItem === undefined ? undefined : `palette-option-${activeItem.id}`
          }
          aria-autocomplete="list"
          aria-controls="palette-listbox"
          aria-expanded
          aria-label="Search commands"
          autoComplete="off"
          /*
           * The field takes focus on open, not the dialog. Measured in the browser: without it the
           * palette opened with focus on the dialog container, so the first keystroke went nowhere
           * and Enter ran nothing — a palette you have to click into is not a palette.
           */
          // biome-ignore lint/a11y/noAutofocus: a modal search field is the case the rule exempts — the palette exists to be typed into
          autoFocus
          className="h-9 w-full rounded-sm border border-border bg-surface-1 px-3 text-foreground text-sm outline-none focus-visible:border-accent"
          data-testid="palette-input"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command…"
          role="combobox"
          value={query}
        />

        {/* biome-ignore lint/a11y/useFocusableInteractive: the combobox keeps focus and points at the
            active option with aria-activedescendant, which is the pattern ACCESSIBILITY.md names */}
        <div
          aria-label="Commands"
          className="relative overflow-y-auto"
          data-testid="palette-listbox"
          id="palette-listbox"
          ref={listRef}
          // biome-ignore lint/a11y/useSemanticElements: a <select> cannot hold virtualized rows or a shortcut column
          role="listbox"
          style={{ height: LIST_HEIGHT }}
        >
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((row) => {
              const item = matches[row.index]

              return item === undefined ? null : (
                <PaletteOption
                  active={row.index === active}
                  height={row.size}
                  index={row.index}
                  item={item}
                  key={item.id}
                  onPick={pick}
                  setSize={matches.length}
                  top={row.start}
                />
              )
            })}
          </div>

          {matches.length === 0 && (
            <p className="p-4 text-center text-foreground-subtle text-xs">
              Nothing matches “{query}”.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}
