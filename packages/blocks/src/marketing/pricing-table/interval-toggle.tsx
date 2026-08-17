import type { Interval } from './pricing-table.schema'
import { INTERVAL_TOGGLE_PLATE, intervalButtonStyles } from './pricing-table.styles'

export interface IntervalToggleProps {
  readonly value: Interval
  readonly onChange: (next: Interval) => void
  readonly label?: string
}

const OPTIONS: readonly { readonly value: Interval; readonly label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

/**
 * Two buttons in a labelled group, with `aria-pressed` carrying which one is on.
 *
 * Not a radio group, and the reason is what the control does: a radio group is a *field* whose value is
 * submitted, and this changes what the page shows. `aria-pressed` on a button is the pattern for a
 * two-state control that acts immediately, and it gets Tab-then-Space for free from the element itself.
 */
export function IntervalToggle({
  value,
  onChange,
  label = 'Billing interval',
}: IntervalToggleProps) {
  return (
    <div
      aria-label={label}
      className={INTERVAL_TOGGLE_PLATE}
      data-testid="interval-toggle"
      // biome-ignore lint/a11y/useSemanticElements: <fieldset> groups form controls whose value is submitted and needs a <legend> to be named; this changes what the page shows
      role="group"
    >
      {OPTIONS.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={intervalButtonStyles({ active: value === option.value })}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
