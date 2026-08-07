import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useId } from 'react'

import { Checkbox } from '../../checkbox/index'
import { Label } from '../../label/index'
import { controlLabelProps } from '../control-row/index'
import { SegmentedField } from '../segmented-field/index'
import { TextField } from '../text-field/index'
import { REL_TOKENS, hrefIssue, relIssue } from './link-url'

import type { LinkFieldProps, LinkValue } from './link-field.types'

const TARGETS = [
  { value: '_self', content: 'Same tab', label: 'Same tab' },
  { value: '_blank', content: 'New tab', label: 'New tab' },
]

/**
 * URL, target, and `rel` — § Control kinds. The scheme is checked as it is typed and the reason is
 * rendered, not just an invalid border: § Accessibility in chrome forbids a colour-only signal.
 */
function LinkFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  className,
}: LinkFieldProps): ReactElement {
  const generated = useId()
  const groupId = id ?? generated
  const issue = mixed ? null : (hrefIssue(value.href) ?? relIssue(value.target, value.rel))
  const issueId = issue === null ? undefined : `${groupId}-issue`
  const described = [describedBy, issueId].filter((part) => part !== undefined)

  const edit = (next: LinkValue): void => {
    onChange(next)
    onCommit(next)
  }

  const toggleRel = (token: string, on: boolean): void => {
    const rel = on ? [...value.rel, token] : value.rel.filter((entry) => entry !== token)

    // Emitted in the declared order, so two links with the same tokens produce the same attribute.
    edit({ ...value, rel: REL_TOKENS.filter((entry) => rel.includes(entry)) })
  }

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={described.length === 0 ? undefined : described.join(' ')}
      className={cn('flex min-w-0 flex-1 flex-col gap-1.5', className)}
      {...controlLabelProps(label, labelledBy)}
    >
      <TextField
        id={groupId}
        label={`${label} URL`}
        value={value.href}
        placeholder="https://"
        disabled={disabled}
        mixed={mixed}
        invalid={issue !== null && !mixed}
        onChange={(href) => onChange({ ...value, href })}
        onCommit={(href) => onCommit({ ...value, href })}
      />

      <SegmentedField
        label={`${label} target`}
        value={value.target}
        options={TARGETS}
        disabled={disabled}
        mixed={mixed}
        onChange={() => undefined}
        onCommit={(target) => edit({ ...value, target: target === '_blank' ? '_blank' : '_self' })}
      />

      <span className="flex flex-wrap items-center gap-2">
        {REL_TOKENS.map((token) => {
          const tokenId = `${groupId}-${token}`

          return (
            <span key={token} className="flex items-center gap-1">
              <Checkbox
                id={tokenId}
                checked={value.rel.includes(token)}
                disabled={disabled}
                onCheckedChange={(checked) => toggleRel(token, checked === true)}
              />
              <Label htmlFor={tokenId} className="text-2xs text-foreground-muted">
                {token}
              </Label>
            </span>
          )
        })}
      </span>

      {issue === null ? null : (
        <p id={issueId} className="text-2xs text-danger">
          {issue}
        </p>
      )}
    </div>
  )
}

export const LinkField = memo(LinkFieldImpl)
