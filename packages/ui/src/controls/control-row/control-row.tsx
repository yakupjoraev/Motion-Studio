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
  controlRowStackedLabelStyles,
  controlRowStackedStyles,
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
  layout = 'inline',
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

  const stacked = layout === 'stacked'

  const reset = (
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
  )

  return (
    <div className={cn(stacked ? controlRowStackedStyles() : controlRowStyles(), className)}>
      {/*
       * `contents` in the inline layout: the header's three children stay direct children of the row's
       * own flex, so one component draws both layouts without the inline one gaining a wrapper.
       */}
      <div className={stacked ? 'flex items-center gap-1.5' : 'contents'}>
        {/* The gutter is reserved whether or not a marker is in it, so labels line up down the panel. */}
        <span className={controlRowDotSlotStyles()}>{indicator}</span>

        <Label
          id={labelId}
          htmlFor={controlId}
          onClick={focusControl}
          className={stacked ? controlRowStackedLabelStyles() : controlRowLabelStyles()}
        >
          {label}
        </Label>

        {stacked ? reset : null}
      </div>

      <span className={stacked ? 'flex min-w-0 flex-col gap-1' : controlRowControlStyles()}>
        {children({ id: controlId, labelledBy: labelId, describedBy: descriptionId, mixed })}
      </span>

      {descriptionId === undefined ? null : (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}

      {stacked ? null : reset}
    </div>
  )
}
