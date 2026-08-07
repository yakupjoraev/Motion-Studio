import { UploadIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useId, useRef } from 'react'

import { Button } from '../../button/index'
import { controlLabelProps } from '../control-row/index'
import { TextField } from '../text-field/index'
import { readAsDataUrl } from './read-file'

import type { ImageFieldProps, ImageValue } from './image-field.types'

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/svg+xml'

/**
 * URL, upload, preview and alt text — § Control kinds. The alt warning is the point of the control: an
 * image with no alt is the most common accessibility defect a page ships with, so the field says so at
 * the moment it is created rather than leaving it to an audit.
 */
function ImageFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  aspect = 16 / 9,
  accept = DEFAULT_ACCEPT,
  className,
}: ImageFieldProps): ReactElement {
  const generated = useId()
  const groupId = id ?? generated
  const fileRef = useRef<HTMLInputElement>(null)
  const warns = !mixed && value.src !== '' && value.alt.trim() === ''
  const warningId = warns ? `${groupId}-alt-warning` : undefined
  const described = [describedBy, warningId].filter((part) => part !== undefined)

  const edit = (next: ImageValue): void => {
    onChange(next)
    onCommit(next)
  }

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={described.length === 0 ? undefined : described.join(' ')}
      className={cn('flex min-w-0 flex-1 flex-col gap-1.5', className)}
      {...controlLabelProps(label, labelledBy)}
    >
      <span
        className="w-full overflow-hidden rounded-sm border border-border bg-surface-2"
        style={{ aspectRatio: aspect }}
      >
        {value.src === '' || mixed ? null : (
          // The preview carries the alt being edited, so an empty one is visible as well as announced.
          <img src={value.src} alt={value.alt} className="h-full w-full object-cover" />
        )}
      </span>

      <span className="flex items-center gap-1">
        <TextField
          id={groupId}
          label={`${label} URL`}
          value={value.src}
          placeholder="https://"
          disabled={disabled}
          mixed={mixed}
          className="min-w-0 flex-1"
          onChange={(src) => onChange({ ...value, src })}
          onCommit={(src) => onCommit({ ...value, src })}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Upload ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <UploadIcon size={12} />
        </Button>
        {/* Hidden rather than styled: a file input cannot be restyled, and the button above is the affordance. */}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file !== undefined) {
              void readAsDataUrl(file).then((src) => {
                if (src !== null) {
                  edit({ ...value, src })
                }
              })
            }
          }}
        />
      </span>

      <TextField
        label={`${label} alt text`}
        value={value.alt}
        placeholder="Describe the image"
        disabled={disabled}
        mixed={mixed}
        invalid={warns}
        onChange={(alt) => onChange({ ...value, alt })}
        onCommit={(alt) => onCommit({ ...value, alt })}
      />

      {warningId === undefined ? null : (
        <p id={warningId} className="text-2xs text-warning">
          An image with no alt text is invisible to a screen reader. Describe it, or say it is
          decorative.
        </p>
      )}
    </div>
  )
}

export const ImageField = memo(ImageFieldImpl)
