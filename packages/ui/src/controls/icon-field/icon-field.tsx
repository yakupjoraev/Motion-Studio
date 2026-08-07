import { ICON_NAMES, ICON_REGISTRY } from '@motion-studio/icons'
import { cn, humanize } from '@motion-studio/utils'
import { type ReactElement, memo, useId, useState } from 'react'

import { Input } from '../../input/index'
import { Popover } from '../../popover/index'
import { ScrollArea } from '../../scroll-area/index'
import { searchIcons } from './icon-search'

import type { IconName } from '@motion-studio/icons'
import type { IconFieldProps, IconValue } from './icon-field.types'

const NONE = 'None'

/**
 * A searchable picker over the icon registry — § Control kinds. `role="listbox"` rather than the block
 * palette's grid: the results are one filtered sequence, and `ACCESSIBILITY.md` reserves the grid pattern
 * for the two-dimensional palette.
 */
function IconFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  names = ICON_NAMES,
  className,
}: IconFieldProps): ReactElement {
  const generated = useId()
  const listId = `${id ?? generated}-list`
  const [query, setQuery] = useState('')
  const results = searchIcons(names, query)
  const Selected = value === '' ? null : ICON_REGISTRY[value]
  const spoken = mixed ? 'Mixed' : value === '' ? NONE : humanize(value)

  const pick = (next: IconValue): void => {
    onChange(next)
    onCommit(next)
  }

  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <Popover
        label={`${label} picker`}
        trigger={
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={`${label}, ${spoken}`}
            aria-describedby={describedBy}
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface-2 outline-none focus-visible:shadow-focus"
          >
            {Selected === null ? (
              <span aria-hidden className="text-2xs text-foreground-subtle">
                —
              </span>
            ) : (
              <Selected size={16} />
            )}
          </button>
        }
      >
        <div className="flex w-[220px] flex-col gap-1.5">
          <Input
            type="search"
            role="searchbox"
            aria-label={`Search ${label.toLowerCase()}`}
            aria-controls={listId}
            placeholder="Search icons"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <p aria-live="polite" className="text-2xs text-foreground-subtle">
            {results.length} icons match
          </p>

          <ScrollArea className="max-h-[180px]">
            <div
              id={listId}
              // biome-ignore lint/a11y/useSemanticElements: a `select` cannot hold a grid of icon glyphs.
              role="listbox"
              tabIndex={-1}
              aria-label={label}
              className="grid grid-cols-6 gap-1"
            >
              <button
                type="button"
                // biome-ignore lint/a11y/useSemanticElements: an `option` element cannot hold a glyph, and this list is a grid of buttons.
                role="option"
                aria-selected={value === ''}
                aria-label={NONE}
                className="flex h-[28px] items-center justify-center rounded-sm text-2xs text-foreground-subtle outline-none hover:bg-surface-2 focus-visible:shadow-focus aria-selected:bg-surface-2"
                onClick={() => pick('')}
              >
                —
              </button>

              {results.map((name: IconName) => {
                const Icon = ICON_REGISTRY[name]

                return (
                  <button
                    key={name}
                    type="button"
                    // biome-ignore lint/a11y/useSemanticElements: an `option` element cannot hold a glyph, and this list is a grid of buttons.
                    role="option"
                    aria-selected={value === name}
                    aria-label={humanize(name)}
                    className="flex h-[28px] items-center justify-center rounded-sm outline-none hover:bg-surface-2 focus-visible:shadow-focus aria-selected:bg-surface-2"
                    onClick={() => pick(name)}
                  >
                    <Icon size={16} />
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </Popover>

      <span className="truncate text-2xs text-foreground-muted">{spoken}</span>
    </span>
  )
}

export const IconField = memo(IconFieldImpl)
