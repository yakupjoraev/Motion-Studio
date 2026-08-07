import { type ReactElement, memo } from 'react'

import { Segmented } from '../../segmented/index'
import { controlLabelProps } from '../control-row/index'

import type { SegmentedFieldProps } from './segmented-field.types'

/** Mixed leaves every segment unselected rather than picking one node's value to stand for the rest. */
function SegmentedFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  id,
  disabled = false,
  mixed = false,
  options,
  className,
}: SegmentedFieldProps): ReactElement {
  return (
    <Segmented
      id={id}
      value={mixed ? '' : value}
      options={options}
      disabled={disabled}
      className={className}
      onValueChange={(next: string) => {
        onChange(next)
        onCommit(next)
      }}
      {...controlLabelProps(label, labelledBy)}
    />
  )
}

export const SegmentedField = memo(SegmentedFieldImpl)
