'use client'

import { blockRegistry } from '@motion-studio/blocks/registry'
import type { useDraggableNode } from '@motion-studio/dnd'
import { selectors } from '@motion-studio/editor'
import {
  CardIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  ICON_REGISTRY,
  type IconComponent,
  LockIcon,
  UnlockIcon,
} from '@motion-studio/icons'
import type { NodeId } from '@motion-studio/schema'
import { FOCUS_RING, TRANSITION_CONTROL } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import { type KeyboardEvent, type PointerEvent, memo, useState } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import type { LayerRowView } from './use-flat-layers'

/** What `useDraggableNode` hands back, without this file importing dnd-kit to name it. */
export type LayerDragHandle = ReturnType<typeof useDraggableNode>

export interface LayerRowProps {
  readonly row: LayerRowView
  /** The one row carrying `tabindex="0"` — ACCESSIBILITY.md § Layers tree. */
  readonly focused: boolean
  readonly renaming: boolean
  /** Where the virtualizer put this row, in pixels from the top of the list. */
  readonly offset: number
  readonly drag: LayerDragHandle
  readonly onSelect: (row: LayerRowView, event: PointerEvent) => void
  readonly onToggle: (row: LayerRowView, subtree: boolean) => void
  readonly onRenameStart: (id: NodeId) => void
  readonly onRenameCommit: (id: NodeId, name: string) => void
  readonly onRenameCancel: () => void
  readonly onVisibility: (row: LayerRowView) => void
  readonly onLock: (row: LayerRowView) => void
}

/** Indent per level, and where the guide lines that mark the levels sit. */
const INDENT_PX = 12
const GUIDE_OFFSET_PX = 10

const ICONS = new Map<string, IconComponent>(Object.entries(ICON_REGISTRY))

const BUTTON_CLASS = cn(
  'grid h-[20px] w-[20px] shrink-0 place-items-center rounded-xs text-foreground-muted',
  'hover:bg-surface-3 hover:text-foreground data-[on=true]:text-foreground',
  'opacity-0 focus-visible:opacity-100 group-hover:opacity-100 data-[on=true]:opacity-100',
  FOCUS_RING,
  TRANSITION_CONTROL,
)

/**
 * One row of the tree, and the only place a node's name, its block icon and its two flags are drawn.
 * It subscribes to nothing but its own selection state: the row's contents arrive as a prop from a
 * flattening that runs once per document version, so a keystroke in the inspector re-renders the
 * inspector and not four hundred rows.
 */
export const LayerRow = memo(function LayerRow({
  row,
  focused,
  renaming,
  offset,
  drag,
  onSelect,
  onToggle,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onVisibility,
  onLock,
}: LayerRowProps) {
  const selected = useStudioStore(selectors.selectIsSelected(row.id))
  const Glyph = ICONS.get(blockRegistry.get(row.blockId)?.icon ?? '') ?? CardIcon
  const Chevron = row.expanded ? ChevronDownIcon : ChevronRightIcon

  return (
    <div
      // First, and never last: dnd-kit's attributes carry `role="button"` and `tabIndex={0}`, and a
      // tree row is a `treeitem` with a roving tabindex. What is worth keeping from them — the
      // roledescription and the pointer to the drag instructions — survives the props below.
      {...drag.attributes}
      {...drag.listeners}
      aria-expanded={row.hasChildren ? row.expanded : undefined}
      aria-level={row.depth + 1}
      aria-posinset={row.posInSet}
      aria-selected={selected}
      aria-setsize={row.setSize}
      className={cn(
        'group absolute left-0 flex h-[26px] w-full items-center gap-1 pr-1 text-xs',
        'hover:bg-surface-2',
        FOCUS_RING,
        TRANSITION_CONTROL,
        selected && 'bg-accent/12 text-foreground',
        row.hidden && 'text-foreground-subtle',
        drag.isDragging && 'opacity-40',
      )}
      data-layer-row={row.id}
      data-selected={String(selected)}
      onDoubleClick={() => onRenameStart(row.id)}
      // On the press, not on the click: the drag sensor's own `pointerdown` suppresses the click that
      // would follow, so a row selected on `click` is a row that never gets selected by mouse. The
      // sensor's handler is called first — the 4 px threshold decides whether this becomes a drag.
      onPointerDown={(event) => {
        drag.listeners?.['onPointerDown']?.(event)
        onSelect(row, event)
      }}
      ref={drag.ref}
      role="treeitem"
      style={{
        // `top`, not `translateY`: dnd-kit measures the node it is dragging with the transform taken
        // back out, so a row positioned by transform reports the position of row zero — the ghost
        // starts at the top of the list and the keyboard drag begins in the wrong container.
        top: `${offset}px`,
        paddingLeft: `${GUIDE_OFFSET_PX + row.depth * INDENT_PX}px`,
        // The level guides: one hairline per level, drawn by the row rather than by a span per depth.
        backgroundImage: `repeating-linear-gradient(to right, var(--ms-color-border) 0 1px, transparent 1px ${INDENT_PX}px)`,
        backgroundSize: `${row.depth * INDENT_PX}px 100%`,
        backgroundPosition: `${GUIDE_OFFSET_PX}px 0`,
        backgroundRepeat: 'no-repeat',
      }}
      tabIndex={focused ? 0 : -1}
    >
      {selected ? (
        <span aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-[2px] bg-accent" />
      ) : null}

      {row.hasChildren ? (
        <button
          aria-label={`${row.expanded ? 'Collapse' : 'Expand'} ${row.name}`}
          className={cn(
            'grid h-[16px] w-[16px] shrink-0 place-items-center rounded-xs text-foreground-muted',
            'hover:text-foreground',
            FOCUS_RING,
            TRANSITION_CONTROL,
          )}
          onClick={(event) => {
            event.stopPropagation()
            onToggle(row, event.altKey)
          }}
          onPointerDown={(event) => event.stopPropagation()}
          tabIndex={-1}
          type="button"
        >
          <Chevron size={12} />
        </button>
      ) : (
        <span aria-hidden="true" className="h-[16px] w-[16px] shrink-0" />
      )}

      <Glyph aria-hidden="true" className="shrink-0 text-foreground-muted" size={12} />

      {renaming ? (
        <RenameField
          name={row.name}
          onCancel={onRenameCancel}
          onCommit={(name) => onRenameCommit(row.id, name)}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{row.name}</span>
      )}

      <button
        aria-label={`${row.hidden ? 'Show' : 'Hide'} ${row.name}`}
        aria-pressed={row.hidden}
        className={BUTTON_CLASS}
        data-on={String(row.hidden)}
        onClick={(event) => {
          event.stopPropagation()
          onVisibility(row)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        tabIndex={-1}
        type="button"
      >
        {row.hidden ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
      </button>

      <button
        aria-label={`${row.locked ? 'Unlock' : 'Lock'} ${row.name}`}
        aria-pressed={row.locked}
        className={BUTTON_CLASS}
        data-on={String(row.locked)}
        onClick={(event) => {
          event.stopPropagation()
          onLock(row)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        tabIndex={-1}
        type="button"
      >
        {row.locked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
      </button>
    </div>
  )
})

interface RenameFieldProps {
  readonly name: string
  readonly onCommit: (name: string) => void
  readonly onCancel: () => void
}

/**
 * A real input with a label, `Enter` commits and `Esc` cancels — ACCESSIBILITY.md § Layers tree. The
 * keys are stopped here so the tree's own map does not read them as navigation.
 */
function RenameField({ name, onCommit, onCancel }: RenameFieldProps) {
  const [draft, setDraft] = useState(name)

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation()

    if (event.key === 'Enter') {
      onCommit(draft)
    }

    if (event.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      aria-label={`Rename ${name}`}
      // biome-ignore lint/a11y/noAutofocus: the field exists because the user asked to rename this row; focusing it is the request.
      autoFocus
      className={cn(
        'min-w-0 flex-1 rounded-xs bg-surface-3 px-1 text-xs outline-none',
        'shadow-[inset_0_0_0_1px_var(--ms-color-accent)]',
      )}
      onBlur={() => onCommit(draft)}
      onChange={(event) => setDraft(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
      value={draft}
    />
  )
}
