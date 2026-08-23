'use client'

import { EXPORT_TARGETS, type ExportTarget } from '@motion-studio/codegen/options'
import { TRANSITION_CONTROL } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'

export interface TargetSelectorProps {
  readonly value: ExportTarget
  readonly onChange: (target: ExportTarget) => void
}

/** EXPORT_ENGINE.md § Printers, one line each: what the reader gets, not what the printer does. */
const TARGETS: Readonly<Record<ExportTarget, { readonly label: string; readonly hint: string }>> = {
  react: { label: 'React', hint: 'Components you paste into a project' },
  next: { label: 'Next.js', hint: 'A project that installs and builds' },
  html: { label: 'HTML', hint: 'One self-contained document' },
  json: { label: 'JSON', hint: 'The .motion document itself' },
  tokens: { label: 'Tokens', hint: 'The theme, in four formats' },
}

const ITEM = cn(
  'flex cursor-pointer flex-col gap-0.5 rounded-sm border px-2 py-1.5',
  'focus-within:shadow-focus hover:bg-surface-2',
  TRANSITION_CONTROL,
)

/**
 * Native radios in a fieldset: the arrow keys, the group name and the single tab stop all come from
 * the browser. A row of buttons would have to reimplement three things and would get one wrong.
 */
export function TargetSelector({ value, onChange }: TargetSelectorProps) {
  return (
    <fieldset className="flex flex-col gap-0.5">
      <legend className="px-2 pb-1 font-medium text-2xs text-foreground-subtle uppercase tracking-wide">
        Target
      </legend>

      {EXPORT_TARGETS.map((target) => {
        const active = value === target

        return (
          <label
            className={cn(ITEM, active ? 'border-accent-ring bg-surface-2' : 'border-transparent')}
            key={target}
          >
            <span className="flex items-center gap-2">
              <input
                checked={active}
                className="sr-only"
                name="export-target"
                onChange={() => onChange(target)}
                type="radio"
                value={target}
              />
              <span
                aria-hidden
                className={cn('size-1.5 rounded-full', active ? 'bg-accent' : 'bg-border-strong')}
              />
              <span className="font-medium text-xs">{TARGETS[target].label}</span>
            </span>
            <span className="pl-3.5 text-2xs text-foreground-subtle">{TARGETS[target].hint}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
