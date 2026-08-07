import { type ReactElement, memo, useId } from 'react'

import { Switch } from '../../switch/index'
import { controlLabelProps } from '../control-row/index'

import type { SwitchFieldProps } from './switch-field.types'

/**
 * `role="switch"` has no third state — ARIA 1.2 allows `mixed` on a checkbox and not on a switch — so a
 * disagreeing selection reads as off and says so in its description rather than lying with `aria-checked`.
 */
function SwitchFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  hint,
  className,
}: SwitchFieldProps): ReactElement {
  const generated = useId()
  const hintId = hint === undefined ? undefined : `${id ?? generated}-hint`
  const mixedId = mixed ? `${id ?? generated}-mixed` : undefined
  const described = [describedBy, hintId, mixedId].filter((entry) => entry !== undefined).join(' ')

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Switch
        id={id}
        checked={mixed ? false : value}
        disabled={disabled}
        aria-describedby={described === '' ? undefined : described}
        className={className}
        onCheckedChange={(next: boolean) => {
          onChange(next)
          onCommit(next)
        }}
        {...controlLabelProps(label, labelledBy)}
      />
      {hint === undefined ? null : (
        <span id={hintId} className="truncate text-2xs text-foreground-subtle">
          {hint}
        </span>
      )}
      {mixedId === undefined ? null : (
        <span id={mixedId} className="sr-only">
          Mixed
        </span>
      )}
    </span>
  )
}

export const SwitchField = memo(SwitchFieldImpl)
