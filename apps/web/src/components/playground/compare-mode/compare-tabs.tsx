'use client'

import { Button, Segmented, Switch } from '@motion-studio/ui'
import { type ReactElement, useEffect } from 'react'

export type CompareSide = 'a' | 'b'

export interface CompareTabsProps {
  readonly enabled: boolean
  onEnabledChange: (next: boolean) => void
  readonly side: CompareSide
  onSideChange: (next: CompareSide) => void
  onSwap: () => void
}

const SIDES = [
  { value: 'a', content: 'A', label: 'Edit A, the left half' },
  { value: 'b', content: 'B', label: 'Edit B, the right half' },
]

/**
 * The editor's two tabs, and the switch that turns the split on. Off by default: the second half
 * doubles the render cost, and a `backdrop-filter` over a photo is not cheap once.
 */
export function CompareTabs({
  enabled,
  onEnabledChange,
  side,
  onSideChange,
  onSwap,
}: CompareTabsProps): ReactElement {
  /* SHORTCUTS.md spells the swap `Cmd+Shift+S`; it only means anything while the split is on. */
  useEffect(() => {
    if (!enabled) {
      return
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSwap()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, onSwap])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-2 text-foreground-muted text-xs">
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label="Compare two values"
        />
        Compare
      </span>
      {enabled && (
        <>
          <Segmented
            options={SIDES}
            value={side}
            onValueChange={(next) => onSideChange(next === 'b' ? 'b' : 'a')}
            aria-label="Which half the editor edits"
          />
          <Button size="sm" variant="ghost" onClick={onSwap}>
            Swap A and B
          </Button>
          <output aria-live="polite" className="sr-only" data-testid="compare-announcement">
            {`Editing ${side === 'a' ? 'A, the left half' : 'B, the right half'}.`}
          </output>
        </>
      )}
    </div>
  )
}
