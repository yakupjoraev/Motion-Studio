'use client'

import { cn } from '@motion-studio/utils'
import { type KeyboardEvent, type ReactElement, useCallback } from 'react'

import { PLAYGROUND_PROPERTIES, type PlaygroundProperty, propertyDescriptor } from './properties'

/**
 * The eight sandboxes as a `radiogroup` — ACCESSIBILITY.md § Playground. One property is chosen at a
 * time, which is what a radio group is, and arrow keys move between the options with only the current
 * one in the tab order.
 */
export interface PropertyListProps {
  readonly value: PlaygroundProperty
  readonly onValueChange: (property: PlaygroundProperty) => void
}

const NEXT: Readonly<Record<string, number>> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
}

export function PropertyList({ value, onValueChange }: PropertyListProps): ReactElement {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = NEXT[event.key]

      if (step === undefined) {
        return
      }

      event.preventDefault()

      const index = PLAYGROUND_PROPERTIES.indexOf(value)
      const count = PLAYGROUND_PROPERTIES.length
      const next = PLAYGROUND_PROPERTIES[(index + step + count) % count]

      if (next !== undefined) {
        onValueChange(next)
      }
    },
    [onValueChange, value],
  )

  return (
    <div
      role="radiogroup"
      aria-label="CSS property"
      onKeyDown={onKeyDown}
      className="flex flex-col gap-1"
    >
      {PLAYGROUND_PROPERTIES.map((property) => {
        const descriptor = propertyDescriptor(property)
        const selected = property === value

        return (
          <button
            key={property}
            type="button"
            // biome-ignore lint/a11y/useSemanticElements: each option carries a heading and a
            // description, which an <input type="radio"> cannot contain — ACCESSIBILITY.md
            // § Playground asks for the ARIA pattern here.
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(property)}
            className={cn(
              'flex flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors [transition-duration:var(--ms-duration-fast)]',
              'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2',
              selected
                ? 'bg-surface-2 text-foreground'
                : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground',
            )}
          >
            <span className="font-medium font-mono text-sm">{descriptor.label}</span>
            <span className="text-foreground-muted text-xs">{descriptor.summary}</span>
          </button>
        )
      })}
    </div>
  )
}
