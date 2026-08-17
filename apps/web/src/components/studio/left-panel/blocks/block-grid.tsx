'use client'

import type { BlockDefinition } from '@motion-studio/schema'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BlockCard } from './block-card'

export const BLOCK_GRID_ID = 'block-grid'

/**
 * Two, because ACCESSIBILITY.md § Block palette requires arrow navigation in two dimensions and one
 * column would leave `←`/`→` doing nothing. Three does not fit: the panel floors at 240 px
 * (`panel-layout.ts`), and a third column takes a card below the width its own name needs.
 */
export const BLOCK_GRID_COLUMNS = 2

/** Card height plus the row gap. Fixed, as PERFORMANCE.md § Virtualization requires of every list here. */
export const BLOCK_CARD_HEIGHT_PX = 122
export const BLOCK_ROW_HEIGHT_PX = 130

/** Rows above and below the window, so a fast scroll never shows a gap. */
const OVERSCAN = 4

export interface GridKeyState {
  readonly count: number
  readonly columns: number
  readonly focusedIndex: number
  /** How many rows a `PageUp` / `PageDown` covers — the viewport, in rows. */
  readonly pageRows: number
}

const clamp = (index: number, count: number): number => Math.min(Math.max(index, 0), count - 1)

/**
 * The six behaviours prompt 37 lists, as a pure function of the press and the list — the same shape
 * `resolveTreeKey` has, and for the same reason: "every key moves where it should" is then a table in
 * a test rather than a walk through a component.
 *
 * Returns the index to move to, or `null` when the press means nothing here — the edge of a row, the
 * end of the grid, or a key the grid does not own.
 */
export function resolveGridKey(key: string, state: GridKeyState): number | null {
  const { count, columns, focusedIndex: at, pageRows } = state

  if (count === 0 || at < 0) {
    return null
  }

  const column = at % columns
  const rowStart = at - column

  switch (key) {
    case 'ArrowRight':
      return column + 1 < columns && at + 1 < count ? at + 1 : null
    case 'ArrowLeft':
      return column > 0 ? at - 1 : null
    case 'ArrowDown':
      return at + columns < count ? at + columns : null
    case 'ArrowUp':
      return at - columns >= 0 ? at - columns : null
    case 'Home':
      return rowStart === at ? null : rowStart
    case 'End': {
      const rowEnd = Math.min(rowStart + columns - 1, count - 1)

      return rowEnd === at ? null : rowEnd
    }
    case 'PageDown': {
      const next = clamp(at + columns * pageRows, count)

      return next === at ? null : next
    }
    case 'PageUp': {
      const previous = clamp(at - columns * pageRows, count)

      return previous === at ? null : previous
    }
    default:
      return null
  }
}

export interface BlockGridProps {
  readonly blocks: readonly BlockDefinition[]
  readonly onInsert: (definition: BlockDefinition) => void
}

/**
 * ACCESSIBILITY.md § Block palette: a real `role="grid"` over a virtual window, one tab stop for the
 * whole thing, and `aria-rowcount` on the grid with `aria-rowindex` per row — the only thing telling
 * a screen reader that the four rendered rows are four of eighteen. ADR-180: `aria-setsize` is the
 * `listbox` form of the same statement and ARIA does not allow it on a `grid` row.
 *
 * Always virtualized, which satisfies the "> 40 cards" threshold of PERFORMANCE.md § Virtualization
 * by construction rather than by a second code path that only runs once the catalogue grows.
 */
export function BlockGrid({ blocks, onInsert }: BlockGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const rows = useMemo(() => {
    const grouped: BlockDefinition[][] = []

    for (let index = 0; index < blocks.length; index += BLOCK_GRID_COLUMNS) {
      grouped.push(blocks.slice(index, index + BLOCK_GRID_COLUMNS))
    }

    return grouped
  }, [blocks])

  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => BLOCK_ROW_HEIGHT_PX,
    getScrollElement: () => scrollRef.current,
    overscan: OVERSCAN,
  })

  const virtualizerRef = useRef(virtualizer)

  virtualizerRef.current = virtualizer

  // A narrowing filter can leave the roving index past the end of the results.
  const focused = focusedIndex < blocks.length ? focusedIndex : 0

  const move = useCallback((index: number) => {
    setFocusedIndex(index)
    virtualizerRef.current.scrollToIndex(Math.floor(index / BLOCK_GRID_COLUMNS))
  }, [])

  // Focus follows the roving index, but only while the user is already inside the grid: a filter that
  // moved focus into the panel would take the keyboard away from the search box being typed in.
  useEffect(() => {
    const grid = gridRef.current
    const definition = blocks[focused]

    if (grid === null || definition === undefined || !grid.contains(document.activeElement)) {
      return
    }

    grid.querySelector<HTMLElement>(`[data-block-card="${definition.id}"]`)?.focus()
  }, [blocks, focused])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const viewport = scrollRef.current?.clientHeight ?? BLOCK_ROW_HEIGHT_PX
      const next = resolveGridKey(event.key, {
        count: blocks.length,
        columns: BLOCK_GRID_COLUMNS,
        focusedIndex: focused,
        pageRows: Math.max(1, Math.floor(viewport / BLOCK_ROW_HEIGHT_PX)),
      })

      if (next === null) {
        return
      }

      event.preventDefault()
      move(next)
    },
    [blocks.length, focused, move],
  )

  const onCardFocus = useCallback(
    (definition: BlockDefinition) => {
      const index = blocks.indexOf(definition)

      if (index !== -1) {
        setFocusedIndex(index)
      }
    },
    [blocks],
  )

  return (
    <div className="h-full overflow-y-auto" data-testid="block-grid-scroll" ref={scrollRef}>
      <div
        aria-label="Blocks"
        aria-rowcount={rows.length}
        className="relative w-full"
        id={BLOCK_GRID_ID}
        onKeyDown={onKeyDown}
        ref={gridRef}
        // biome-ignore lint/a11y/useSemanticElements: ACCESSIBILITY.md § Block palette specifies role="grid"; a real table would announce column headers the palette has none of
        role="grid"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index]

          return row === undefined ? null : (
            // biome-ignore lint/a11y/useFocusableInteractive: the grid is one tab stop and the cards inside hold it — ACCESSIBILITY.md § Block palette
            <div
              aria-rowindex={item.index + 1}
              className="absolute left-0 grid w-full gap-2 px-2"
              key={item.key}
              // biome-ignore lint/a11y/useSemanticElements: part of the same role="grid" the palette is specified as
              role="row"
              style={{
                gridTemplateColumns: `repeat(${BLOCK_GRID_COLUMNS}, minmax(0, 1fr))`,
                height: `${BLOCK_CARD_HEIGHT_PX}px`,
                top: `${item.start}px`,
              }}
            >
              {row.map((definition) => (
                <BlockCard
                  definition={definition}
                  focused={definition === blocks[focused]}
                  key={definition.id}
                  onFocus={onCardFocus}
                  onInsert={onInsert}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
