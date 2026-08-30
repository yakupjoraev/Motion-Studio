'use client'

import type { BlockDefinition, ControlDescriptor, UnknownProps } from '@motion-studio/schema'
import { ControlRenderer, ControlRow } from '@motion-studio/ui'

export interface BlockControlsProps {
  readonly definition: BlockDefinition | undefined
  readonly props: UnknownProps
  readonly onChange: (path: string, value: unknown) => void
  readonly onCommit: () => void
}

/**
 * The inspector's controls, driven by this page's state instead of the store.
 *
 * `ControlRenderer` and `ControlRow` come from `@motion-studio/ui` because prompt 23 put them there
 * for this exact second consumer — `prompts/52`: "If you find yourself writing a control component
 * in `apps/web/src/components/gallery/`, stop." Nothing in this file knows what a slider is; it knows
 * what a descriptor is, and the descriptor is the block's own.
 *
 * Only top-level props are editable here. A dot path addresses a nested object, and a nested object
 * has no place in a query string — `url-props.ts` draws the same line, so the controls a visitor sees
 * are exactly the ones a shared link can carry.
 */
export function BlockControls({ definition, props, onChange, onCommit }: BlockControlsProps) {
  if (definition === undefined) {
    return <ControlsSkeleton />
  }

  const values = props as Record<string, unknown>

  return (
    <div className="flex flex-col" data-testid="block-controls">
      {definition.controls.map((group) => {
        const controls = group.controls.filter((control) => !control.path.includes('.'))

        if (controls.length === 0) {
          return null
        }

        return (
          <section className="border-border-subtle border-b py-3 last:border-b-0" key={group.id}>
            <h3 className="px-3 pb-2 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
              {group.label}
            </h3>

            <div className="flex flex-col gap-1 px-3">
              {controls.map((descriptor) => (
                <Row
                  descriptor={descriptor}
                  key={descriptor.path}
                  onChange={onChange}
                  onCommit={onCommit}
                  value={values[descriptor.path]}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

interface RowProps {
  readonly descriptor: ControlDescriptor
  readonly value: unknown
  readonly onChange: (path: string, value: unknown) => void
  readonly onCommit: () => void
}

/**
 * `onChange` per frame and `onCommit` on release, which is the contract `ControlRenderer` states.
 * Here the split is state versus URL: a drag moves the preview sixty times and writes the address bar
 * once — `prompts/52` § URL-synced state.
 */
function Row({ descriptor, value, onChange, onCommit }: RowProps) {
  return (
    <ControlRow
      label={descriptor.label}
      {...(descriptor.hint === undefined ? {} : { description: descriptor.hint })}
    >
      {(slot) => (
        <ControlRenderer
          descriptor={descriptor}
          onChange={(next) => onChange(descriptor.path, next)}
          onCommit={(next) => {
            onChange(descriptor.path, next)
            onCommit()
          }}
          slot={slot}
          value={value}
        />
      )}
    </ControlRow>
  )
}

/** The panel's own height, held while the block's metadata is in flight, so nothing jumps. */
function ControlsSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3" data-testid="controls-skeleton">
      {[0, 1, 2, 3, 4].map((row) => (
        <div className="h-7 animate-pulse rounded-xs bg-surface-2" key={row} />
      ))}
    </div>
  )
}
