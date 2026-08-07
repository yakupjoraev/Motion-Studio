import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useEffect, useId, useState } from 'react'

import { Textarea } from '../../textarea/index'
import { controlLabelProps } from '../control-row/index'
import { validateCss } from './css-validate'

import type { CssFieldProps } from './css-field.types'

/**
 * The escape hatch. It validates as you type and commits on blur, so a half-written declaration never
 * reaches the document — and the reasons are rendered, not implied by a border colour.
 *
 * Feedback goes in a polite live region: `ACCESSIBILITY.md` § Playground sets that pattern for the CSS
 * editor, and this is the same job in a smaller box.
 */
function CssFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  properties,
  rows = 3,
  className,
}: CssFieldProps): ReactElement {
  const generated = useId()
  const fieldId = id ?? generated
  const [draft, setDraft] = useState(mixed ? '' : value)

  useEffect(() => {
    setDraft(mixed ? '' : value)
  }, [value, mixed])

  const issues = mixed ? [] : validateCss(draft, properties)
  const issuesId = issues.length === 0 ? undefined : `${fieldId}-issues`
  const described = [describedBy, issuesId].filter((part) => part !== undefined)

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}>
      <Textarea
        id={fieldId}
        value={draft}
        minRows={rows}
        maxRows={12}
        spellCheck={false}
        placeholder={mixed ? 'Mixed' : 'letter-spacing: -0.01em;'}
        disabled={disabled}
        invalid={issues.length > 0}
        aria-describedby={described.length === 0 ? undefined : described.join(' ')}
        className="font-mono"
        onChange={(event) => {
          setDraft(event.target.value)
          onChange(event.target.value)
        }}
        onBlur={() => {
          // A committed value is one that parsed. An invalid draft stays in the field to be fixed.
          if (draft !== value && validateCss(draft, properties).length === 0) {
            onCommit(draft)
          }
        }}
        {...controlLabelProps(label, labelledBy)}
      />

      {issuesId === undefined ? null : (
        <ul id={issuesId} aria-live="polite" className="flex flex-col gap-0.5">
          {issues.map((issue) => (
            <li key={`${issue.line}-${issue.message}`} className="text-2xs text-danger">
              Line {issue.line}: {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const CssField = memo(CssFieldImpl)
