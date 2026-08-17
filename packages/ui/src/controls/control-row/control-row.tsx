import { ReplayIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ReactElement, useId } from 'react'

import { Button } from '../../button/index'
import { Label } from '../../label/index'
import {
  controlRowControlStyles,
  controlRowDotSlotStyles,
  controlRowLabelStyles,
  controlRowResetStyles,
  controlRowStyles,
} from './control-row.styles'

import type { ControlRowProps } from './control-row.types'

/**
 * Label left, control right — `UI_GUIDELINES.md` § Control rows — plus the three states § Control rows
 * and § Multi-selection define: overridden at a breakpoint, differing from the default, mixed across a
 * selection.
 *
 * `children` is a function because `id`, the label's id, the description's id and `mixed` all have to
 * reach an element this component does not own. ADR-038.
 */
export function ControlRow({
  label,
  children,
  indicator,
  description,
  modified = false,
  mixed = false,
  onReset,
  id,
  className,
}: ControlRowProps): ReactElement {
  const generated = useId()
  const controlId = id ?? generated
  const labelId = `${controlId}-label`
  const descriptionId = description === undefined ? undefined : `${controlId}-override`
  const canReset = onReset !== undefined && modified

  // `htmlFor` reaches a native control only. A composite is a `div`, and § Control rows still wants the
  // label to be part of its click target.
  const focusControl = (): void => {
    document.getElementById(controlId)?.focus()
  }

  return (
    <div className={cn(controlRowStyles(), className)}>
      {/* The gutter is reserved whether or not a marker is in it, so labels line up down the panel. */}
      <span className={controlRowDotSlotStyles()}>{indicator}</span>

      <Label
        id={labelId}
        htmlFor={controlId}
        onClick={focusControl}
        className={controlRowLabelStyles()}
      >
        {label}
      </Label>

      <span className={controlRowControlStyles()}>
        {children({ id: controlId, labelledBy: labelId, describedBy: descriptionId, mixed })}
      </span>

      {descriptionId === undefined ? null : (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}

      <span className={controlRowResetStyles({ visible: canReset })}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Reset ${label}`}
          disabled={!canReset}
          tabIndex={canReset ? undefined : -1}
          onClick={onReset}
        >
          <ReplayIcon size={12} />
        </Button>
      </span>
    </div>
  )
}
