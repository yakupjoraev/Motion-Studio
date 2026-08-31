'use client'

import { Dialog } from '@motion-studio/ui'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { PaletteCombobox } from '../../palette/palette-combobox'
import type { StudioShortcutContext } from '../shortcuts/shortcut.types'

import { fuzzyScore } from './fuzzy-match'
import { PaletteOption } from './palette-option'
import { type PaletteItem, usePaletteItems } from './use-palette-items'
import { useRecentItems } from './use-recent-items'

const ROW_HEIGHT = 32
const LIST_HEIGHT = 320

/**
 * `⌘K`. SHORTCUTS.md § Command palette, including the two rules that are easy to miss: recent items
 * come first whatever the score, and `Tab` does nothing, so focus cannot leave a modal that owns the
 * keyboard. The combobox itself is shared with the docs site — ADR-310.
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

  const pick = (item: PaletteItem | undefined): void => {
    if (item === undefined || !item.available) {
      return
    }

    remember(item.id)
    setOpen(false)
    item.run()
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
      <PaletteCombobox
        active={active}
        activeOptionId={activeItem === undefined ? undefined : `palette-option-${activeItem.id}`}
        count={matches.length}
        empty={
          <p className="p-4 text-center text-foreground-subtle text-xs">
            Nothing matches “{query}”.
          </p>
        }
        inputLabel="Search commands"
        inputTestId="palette-input"
        listHeight={LIST_HEIGHT}
        listId="palette-listbox"
        listLabel="Commands"
        listRef={listRef}
        listTestId="palette-listbox"
        onPick={(index) => pick(matches[index])}
        placeholder="Type a command…"
        query={query}
        setActive={setActive}
        setQuery={setQuery}
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
      </PaletteCombobox>
    </Dialog>
  )
}
