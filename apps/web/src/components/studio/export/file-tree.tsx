'use client'

import type { ExportFile } from '@motion-studio/codegen'
import { CopyIcon } from '@motion-studio/icons'
import { DENSITY, Skeleton } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react'

export interface FileTreeProps {
  readonly files: readonly ExportFile[]
  /** Paths Prettier has been over. Anything else shows a skeleton where its size will be. */
  readonly formatted: readonly string[]
  readonly selected: string | null
  readonly onSelect: (path: string) => void
  readonly onCopy: (file: ExportFile) => void
  /** While the pipeline is still running, so the empty list reads as "not yet" and not as "none". */
  readonly pending: boolean
}

const OVERSCAN = 8

const encoder = new TextEncoder()

/** kB with one decimal, the unit a file list is read in. Bytes below a kilobyte, because 0.1 kB is not a size. */
export const formatSize = (bytes: number): string =>
  bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(1)} kB`

/**
 * An export can be twenty-five files, and the tree is virtualized for the same reason the layers tree
 * is: `aria-setsize` and `aria-posinset` on every row are what tell a screen reader that the twelve
 * rendered rows are twelve of twenty-five.
 */
export function FileTree({ files, formatted, selected, onSelect, onCopy, pending }: FileTreeProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const done = useMemo(() => new Set(formatted), [formatted])

  const sizes = useMemo(
    () => new Map(files.map((file) => [file.path, encoder.encode(file.contents).length])),
    [files],
  )

  const total = useMemo(() => [...sizes.values()].reduce((sum, size) => sum + size, 0), [sizes])

  const virtualizer = useVirtualizer({
    count: files.length,
    estimateSize: () => DENSITY.layerRow,
    getItemKey: (index) => files[index]?.path ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: OVERSCAN,
  })

  const current = focused ?? selected ?? files[0]?.path ?? null

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const index = files.findIndex((file) => file.path === current)
      const next =
        event.key === 'ArrowDown'
          ? index + 1
          : event.key === 'ArrowUp'
            ? index - 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? files.length - 1
                : null

      if (next === null) {
        return
      }

      event.preventDefault()

      const target = files[Math.min(Math.max(next, 0), files.length - 1)]

      if (target !== undefined) {
        setFocused(target.path)
        onSelect(target.path)
        virtualizer.scrollToIndex(files.indexOf(target))
      }
    },
    [current, files, onSelect, virtualizer],
  )

  if (files.length === 0) {
    return pending ? (
      <div className="flex flex-col gap-1 p-2" data-testid="export-files-pending">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton height={DENSITY.layerRow - 4} key={row} shape="text" />
        ))}
      </div>
    ) : (
      <p className="p-2 text-2xs text-foreground-subtle">No files.</p>
    )
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-baseline justify-between px-2 pb-1">
        <span className="font-medium text-2xs text-foreground-subtle uppercase tracking-wide">
          Files
        </span>
        <span className="text-2xs text-foreground-subtle tabular-nums">
          {files.length} · {formatSize(total)}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
        <div
          aria-label="Generated files"
          className="relative w-full"
          data-testid="export-file-tree"
          role="tree"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const file = files[item.index]

            if (file === undefined) {
              return null
            }

            const active = file.path === selected

            return (
              <div
                aria-level={1}
                aria-posinset={item.index + 1}
                aria-selected={active}
                aria-setsize={files.length}
                className={cn(
                  'absolute inset-x-0 flex items-center gap-2 px-2 text-xs outline-none',
                  'hover:bg-surface-2 focus-visible:shadow-focus',
                  active && 'bg-surface-2 text-foreground',
                )}
                data-file-row={file.path}
                key={item.key}
                onClick={() => {
                  setFocused(file.path)
                  onSelect(file.path)
                }}
                onFocus={() => setFocused(file.path)}
                onKeyDown={onKeyDown}
                role="treeitem"
                style={{
                  height: `${DENSITY.layerRow}px`,
                  transform: `translateY(${item.start}px)`,
                }}
                tabIndex={file.path === current ? 0 : -1}
              >
                <span className="min-w-0 flex-1 truncate font-mono">{file.path}</span>

                <span className="shrink-0 text-2xs text-foreground-subtle tabular-nums">
                  {done.has(file.path) ? (
                    formatSize(sizes.get(file.path) ?? 0)
                  ) : (
                    <Skeleton height={8} shape="text" width={36} />
                  )}
                </span>

                <button
                  aria-label={`Copy ${file.path}`}
                  className="shrink-0 rounded-xs p-1 text-foreground-subtle outline-none hover:text-foreground focus-visible:shadow-focus"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCopy(file)
                  }}
                  type="button"
                >
                  <CopyIcon size={12} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
