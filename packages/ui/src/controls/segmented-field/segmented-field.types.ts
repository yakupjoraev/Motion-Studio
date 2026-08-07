import type { SegmentedOption } from '../../segmented/index'
import type { ValueControlProps } from '../control-row/index'

export interface SegmentedFieldProps extends ValueControlProps<string> {
  /** `COMPONENT_LIBRARY.md` § Control kinds caps this kind at four. */
  readonly options: readonly SegmentedOption[]
}
