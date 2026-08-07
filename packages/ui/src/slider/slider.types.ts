/** One value, not Radix's array: COMPONENT_LIBRARY.md § Control kinds defines `slider` as one number. */
export interface SliderProps {
  readonly value?: number
  readonly defaultValue?: number
  /** Fires on every step of a drag. See `onValueCommit`. */
  readonly onValueChange?: (value: number) => void
  /** Fires on release. Contract § 5: this is the edge the editor records a history entry on. */
  readonly onValueCommit?: (value: number) => void
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly disabled?: boolean
  /** Names the thumb, which is the `role="slider"`. */
  readonly 'aria-label'?: string | undefined
  readonly 'aria-labelledby'?: string | undefined
  /** "16 pixels", not "16" — ACCESSIBILITY.md § Inspector wants the unit announced. */
  readonly 'aria-valuetext'?: string | undefined
  readonly id?: string | undefined
  readonly name?: string | undefined
  readonly className?: string | undefined
}
