import { type ChangeEvent, type ReactElement, memo, useEffect, useState } from 'react'

import { Textarea } from '../../textarea/index'
import { controlLabelProps } from '../control-row/index'

import type { TextareaFieldProps } from './textarea-field.types'

/** No `Enter` shortcut: in a multi-line field that key is a newline. Blur commits. */
function TextareaFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  rows = 2,
  maxRows,
  maxLength,
  placeholder,
  invalid = false,
  className,
}: TextareaFieldProps): ReactElement {
  const [draft, setDraft] = useState(mixed ? '' : value)

  useEffect(() => {
    setDraft(mixed ? '' : value)
  }, [value, mixed])

  return (
    <Textarea
      id={id}
      value={draft}
      minRows={rows}
      maxRows={maxRows}
      maxLength={maxLength}
      placeholder={mixed ? 'Mixed' : placeholder}
      disabled={disabled}
      invalid={invalid}
      aria-describedby={describedBy}
      className={className}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(event.target.value)
        onChange(event.target.value)
      }}
      onBlur={() => {
        if (draft !== value) {
          onCommit(draft)
        }
      }}
      {...controlLabelProps(label, labelledBy)}
    />
  )
}

export const TextareaField = memo(TextareaFieldImpl)
