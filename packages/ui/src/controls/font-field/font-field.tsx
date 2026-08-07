import { cn } from '@motion-studio/utils'
import { type ReactElement, memo } from 'react'

import { controlLabelProps } from '../control-row/index'
import { ScrubField } from '../scrub-field/index'
import { SelectField } from '../select-field/index'

import type { FontFieldProps, FontValue } from './font-field.types'

/** `DESIGN_SYSTEM.md` § Typography ships these weights; a caller with a variable font can pass its own. */
const DEFAULT_WEIGHTS: readonly number[] = [300, 400, 500, 600, 700]

const DEFAULT_FAMILIES = [
  { value: 'var(--ms-font-sans)', label: 'Sans' },
  { value: 'var(--ms-font-mono)', label: 'Mono' },
]

/** Family, size, weight and tracking as one row — § Control kinds groups them under the `font` kind. */
function FontFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  families = DEFAULT_FAMILIES,
  weights = DEFAULT_WEIGHTS,
  className,
}: FontFieldProps): ReactElement {
  const edit = (next: FontValue, commit: boolean): void => {
    onChange(next)

    if (commit) {
      onCommit(next)
    }
  }

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={describedBy}
      className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}
      {...controlLabelProps(label, labelledBy)}
    >
      <SelectField
        id={id}
        label={`${label} family`}
        value={value.family}
        options={families}
        disabled={disabled}
        mixed={mixed}
        onChange={(family) => edit({ ...value, family }, false)}
        onCommit={(family) => edit({ ...value, family }, true)}
      />

      <span className="flex items-center gap-1">
        <ScrubField
          label={`${label} size`}
          value={value.size}
          min={1}
          unit="px"
          disabled={disabled}
          mixed={mixed}
          className="min-w-0 flex-1"
          onChange={(size) => edit({ ...value, size }, false)}
          onCommit={(size) => edit({ ...value, size }, true)}
        />
        <SelectField
          label={`${label} weight`}
          value={String(value.weight)}
          options={weights.map((weight) => ({ value: String(weight), label: String(weight) }))}
          disabled={disabled}
          mixed={mixed}
          className="min-w-0 flex-1"
          onChange={(weight) => edit({ ...value, weight: Number.parseInt(weight, 10) }, false)}
          onCommit={(weight) => edit({ ...value, weight: Number.parseInt(weight, 10) }, true)}
        />
        <ScrubField
          label={`${label} tracking`}
          value={value.tracking}
          step={0.01}
          unit="em"
          disabled={disabled}
          mixed={mixed}
          className="min-w-0 flex-1"
          onChange={(tracking) => edit({ ...value, tracking }, false)}
          onCommit={(tracking) => edit({ ...value, tracking }, true)}
        />
      </span>
    </div>
  )
}

export const FontField = memo(FontFieldImpl)
