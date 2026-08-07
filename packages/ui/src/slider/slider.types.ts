/**
 * A single value, not Radix's array. `COMPONENT_LIBRARY.md` § Control kinds defines the registry's `slider`
 * as "Slider + number" with `min`, `max`, `step` — one number per property. Exposing `[72]` to every caller
 * so that a range slider nobody has asked for would fit is the wrong trade; a two-thumb control, if it is
 * ever needed, is a different component with a different keyboard contract.
 */
export interface SliderProps {
  readonly value?: number
  readonly defaultValue?: number
  /** Fires on every step of a drag. High-frequency by nature — see `onValueCommit`. */
  readonly onValueChange?: (value: number) => void
  /**
   * Fires once, when the pointer is released or the key is lifted. The contract § 5 requires that a slider
   * drag re-render on commit only, so this is the edge the editor records a history entry on.
   */
  readonly onValueCommit?: (value: number) => void
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly disabled?: boolean
  /** Required when no visible `Label` is wired to it. It names the thumb, which is the `role="slider"`. */
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  /**
   * The spoken value, when the number alone is not the value — "72 percent", "16 pixels".
   * `ACCESSIBILITY.md` § Inspector requires the unit to be announced.
   */
  readonly 'aria-valuetext'?: string
  readonly id?: string
  readonly name?: string
  readonly className?: string
}
