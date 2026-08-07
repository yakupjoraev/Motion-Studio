import { cn } from '@motion-studio/utils'
import { type ReactElement, memo } from 'react'

import { Popover } from '../../popover/index'
import { CHECKERBOARD, ColorPicker, resolveColor, speakColor } from '../color-picker/index'

import type { ColorFieldProps } from './color-field.types'

/**
 * A 20 × 20 swatch over a checkerboard — § Control rows — that opens the picker. `Popover` rather than
 * `Dialog` because the canvas stays live behind it.
 *
 * The swatch names itself even inside a labelled row, which is the one place `controlLabelProps` does not
 * apply: `ACCESSIBILITY.md` § Inspector requires a colour control to announce its value as part of its
 * name ("Accent, oklch 58% 0.18 285"), and a row label cannot carry a value that changes.
 */
function ColorFieldImpl({
  label,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  className,
  ...picker
}: ColorFieldProps): ReactElement {
  const resolved = resolveColor(picker.value, picker.tokens)
  const spoken = mixed ? 'Mixed' : speakColor(picker.value, picker.tokens)

  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <Popover
        label={`${label} picker`}
        trigger={
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={`${label}, ${spoken}`}
            aria-describedby={describedBy}
            className={cn(
              'relative h-[20px] w-[20px] shrink-0 rounded-sm border border-border',
              CHECKERBOARD,
            )}
          >
            {resolved === null || mixed ? null : (
              <span className="absolute inset-0 rounded-[1px]" style={{ background: resolved }} />
            )}
          </button>
        }
      >
        <ColorPicker {...picker} label={label} mixed={mixed} disabled={disabled} />
      </Popover>

      <span className="truncate text-2xs text-foreground-muted">{spoken}</span>
    </span>
  )
}

export const ColorField = memo(ColorFieldImpl)
