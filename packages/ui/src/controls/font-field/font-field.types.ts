import type { ValueControlProps } from '../control-row/index'

/** The four properties `COMPONENT_LIBRARY.md` § Control kinds names for the `font` kind — ADR-040. */
export interface FontValue {
  /** A family name or a token reference; the caller's `families` list is what it is chosen from. */
  readonly family: string
  /** Pixels, which is what the type scale in `DESIGN_SYSTEM.md` § Typography is expressed in. */
  readonly size: number
  readonly weight: number
  /** Letter spacing in em, the unit that survives a size change. */
  readonly tracking: number
}

export interface FontFamilyOption {
  readonly value: string
  readonly label: string
}

export interface FontFieldProps extends ValueControlProps<FontValue> {
  readonly families?: readonly FontFamilyOption[] | undefined
  readonly weights?: readonly number[] | undefined
}
