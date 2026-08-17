'use client'

import { useDraggableBlock } from '@motion-studio/dnd'
import { BLOCK_CATEGORIES, type BlockDefinition } from '@motion-studio/schema'
import { FOCUS_RING } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import { type KeyboardEvent, memo, useCallback, useMemo, useState } from 'react'

import { BlockThumbnail } from './block-thumbnail'

export interface BlockCardProps {
  readonly definition: BlockDefinition
  /** Roving tabindex — ACCESSIBILITY.md § Block palette: the grid is one tab stop. */
  readonly focused: boolean
  readonly onInsert: (definition: BlockDefinition) => void
  /** The grid keeps the roving index, so a click has to tell it where the user went. */
  readonly onFocus: (definition: BlockDefinition) => void
}

/** "Pricing table, marketing block" — the accessible name ACCESSIBILITY.md § Block palette specifies. */
export const cardLabel = (definition: BlockDefinition): string =>
  `${definition.name}, ${BLOCK_CATEGORIES[definition.category].toLowerCase()} block`

const CARD_CLASS =
  'flex h-full w-full flex-col gap-1.5 rounded-sm border border-border bg-surface-1 p-1.5 text-left transition-colors hover:border-border-strong data-[dragging=true]:opacity-40'

/**
 * One registry entry. Memoised because a keystroke in the search box re-renders the grid and a card
 * that re-renders re-decodes nothing but still costs a diff over thirty-five of them.
 *
 * `Enter` inserts and `Space` picks up for a keyboard drag — prompt 37, and the mirror image of the
 * layers tree, where a row is already in the document and `Space` selects it (ADR-136).
 */
export const BlockCard = memo(function BlockCard({
  definition,
  focused,
  onInsert,
  onFocus,
}: BlockCardProps) {
  const [hovered, setHovered] = useState(false)
  const drag = useDraggableBlock({ blockId: definition.id, label: cardLabel(definition) })

  const insert = useCallback(() => onInsert(definition), [definition, onInsert])

  /**
   * One handler, because the sensor's own `onKeyDown` arrives in the same spread and the last one
   * written wins. dnd-kit activates a drag on `Enter` as well as `Space`; here `Enter` is the insert
   * path — the mirror image of the layers tree, where a row is in the document already (ADR-136).
   */
  const listeners = useMemo(() => {
    const source = drag.listeners

    return {
      ...source,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          insert()

          return
        }

        source?.['onKeyDown']?.(event)
      },
    }
  }, [drag.listeners, insert])

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: the cell holds the button that holds the roving tabindex; a focusable cell would be a second tab stop per card
    <div
      className="min-w-0"
      // biome-ignore lint/a11y/useSemanticElements: ACCESSIBILITY.md § Block palette specifies role="grid" with role="gridcell" cards; a table would announce columns the catalogue does not have
      role="gridcell"
    >
      <button
        aria-label={cardLabel(definition)}
        className={cn(CARD_CLASS, FOCUS_RING)}
        data-block-card={definition.id}
        data-dragging={drag.isDragging}
        data-testid="block-card"
        onDoubleClick={insert}
        onFocus={() => onFocus(definition)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        ref={drag.ref}
        title={definition.description}
        type="button"
        {...drag.attributes}
        {...listeners}
        // After the spread: dnd-kit's attributes carry a tab stop of their own, and the grid is one.
        tabIndex={focused ? 0 : -1}
      >
        <BlockThumbnail definition={definition} hovered={hovered} />
        <span className="truncate text-2xs text-foreground">{definition.name}</span>
        <span className="truncate text-[10px] text-foreground-subtle uppercase tracking-wide">
          {BLOCK_CATEGORIES[definition.category]}
        </span>
      </button>
    </div>
  )
})
