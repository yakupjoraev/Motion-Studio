import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
  memo,
  useEffect,
  useState,
} from 'react'

import { Input } from '../../input/index'
import { controlLabelProps } from '../control-row/index'

import type { TextFieldProps } from './text-field.types'

/**
 * A keystroke is `onChange`; leaving the field or pressing `Enter` is `onCommit`. Typing a name should
 * not put twelve entries in the history — `STATE_MANAGEMENT.md` § Transient state.
 */
function TextFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  maxLength,
  placeholder,
  invalid = false,
  className,
}: TextFieldProps): ReactElement {
  const [draft, setDraft] = useState(mixed ? '' : value)

  useEffect(() => {
    setDraft(mixed ? '' : value)
  }, [value, mixed])

  const commit = (): void => {
    if (draft !== value) {
      onCommit(draft)
    }
  }

  return (
    <Input
      id={id}
      value={draft}
      placeholder={mixed ? 'Mixed' : placeholder}
      maxLength={maxLength}
      disabled={disabled}
      invalid={invalid}
      aria-describedby={describedBy}
      className={className}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value)
        onChange(event.target.value)
      }}
      onBlur={commit}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        }
      }}
      {...controlLabelProps(label, labelledBy)}
    />
  )
}

export const TextField = memo(TextFieldImpl)
