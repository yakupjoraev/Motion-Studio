import type { ReactNode } from 'react'

import type { ValueControlProps } from '../control-row/index'

export interface ListFieldProps<T> extends ValueControlProps<readonly T[]> {
  /** What "Add" produces. The control never invents an item's shape. */
  readonly createItem: () => T
  /** The row's summary and the name every per-item button is built from. */
  readonly itemLabel: (item: T, index: number) => string
  /** `COMPONENT_LIBRARY.md` § Control kinds calls this `itemControls`. */
  readonly renderItem: (
    item: T,
    index: number,
    edit: (next: T, commit: boolean) => void,
  ) => ReactNode
  readonly max?: number | undefined
  /** Reordering off leaves the list in the order the caller supplied it. */
  readonly sortable?: boolean | undefined
}
