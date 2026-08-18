'use client'

import { useId } from 'react'

import { ControlIcon } from '../control-icon'
import { ICON_SIZE, controlStyles } from '../interactive.styles'

import { tooltipBubbleStyles, tooltipRootStyles } from './tooltip-target.styles'
import type { TooltipTargetProps } from './tooltip-target.types'
import { useTooltip } from './use-tooltip'

/**
 * A control with a tooltip on it.
 *
 * **The control is the block's own**, and that is ADR-202 rather than a shortcut: `aria-describedby` is only
 * read on the element that carries it, so the description has to be on the element that takes focus. A wrapper
 * around a child block would put it on a node nobody ever focuses, and reaching into the child is not
 * available either — the canvas hands children down as renderers, so cloning one adds a prop two levels above
 * the markup.
 *
 * Radix Tooltip is not used for the reason ADR-190 gave and this block does not change: `Tooltip.Root` throws
 * without a provider, and a block cannot install application-level context.
 *
 * The bubble is always in the DOM and always the description target. A tooltip that mounted on hover would be
 * a description a screen-reader user never gets, which is the defect a block whose whole purpose is a tooltip
 * cannot ship.
 */
export function TooltipTarget({
  label,
  icon,
  variant,
  size,
  content,
  side,
  delay,
  hidden,
}: TooltipTargetProps) {
  const tooltip = useTooltip(delay)
  const bubbleId = useId()

  return (
    <span
      className={tooltipRootStyles({ hidden })}
      data-testid="tooltip-target"
      // On the wrapper, so moving the pointer from the control into the bubble never leaves the element that
      // owns the state — which is what "hoverable" in WCAG 1.4.13 means.
      onPointerEnter={tooltip.show}
      onPointerLeave={tooltip.hide}
    >
      <button
        aria-describedby={bubbleId}
        className={controlStyles({ variant, size })}
        data-testid="tooltip-trigger"
        onBlur={tooltip.hide}
        onFocus={tooltip.showNow}
        type="button"
      >
        <ControlIcon name={icon} size={ICON_SIZE[size]} />
        {label}
      </button>

      <span
        className={tooltipBubbleStyles({ side, open: tooltip.open })}
        data-state={tooltip.open ? 'open' : 'closed'}
        data-testid="tooltip-bubble"
        id={bubbleId}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}
