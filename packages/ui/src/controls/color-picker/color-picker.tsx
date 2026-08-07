import { DropletIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ReactElement, memo, useEffect, useId, useRef, useState } from 'react'
import { type Color, parseColor } from 'react-stately'

import { Button } from '../../button/index'
import { Input } from '../../input/index'
import { controlLabelProps } from '../control-row/index'
import { ColorArea } from './color-area'
import { ColorChannelSlider } from './color-channel-slider'
import { colorPickerStyles, contrastReadoutStyles } from './color-picker.styles'
import { ColorPresets } from './color-presets'
import { contrastReadout, fromHex, isHex, resolve, speakColor, toHex } from './color-value'
import { eyeDropperSupported, pickScreenColor } from './eyedropper'

import type { ColorPickerProps, ColorValue } from './color-picker.types'

/** What the area starts from when the stored value names a token this theme does not have. */
const FALLBACK = 'oklch(50% 0 0)'

function ColorPickerImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  tokens = [],
  alpha = false,
  background,
  recent = [],
  className,
}: ColorPickerProps): ReactElement {
  const generated = useId()
  const groupId = id ?? generated
  const resolved = resolve(value, tokens)

  const [working, setWorking] = useState<Color>(() =>
    parseColor(toHex(resolved ?? FALLBACK)).toFormat('hsb'),
  )
  const [draft, setDraft] = useState<string | null>(null)
  const [hasEyeDropper] = useState(eyeDropperSupported)

  /** What this component last sent out, so a value coming back in does not re-seed the gesture. */
  const emitted = useRef<string | null>(null)

  useEffect(() => {
    if (resolved !== null && resolved !== emitted.current) {
      setWorking(parseColor(toHex(resolved)).toFormat('hsb'))
    }
  }, [resolved])

  const emit = (color: Color, commit: boolean): void => {
    const next: ColorValue = { kind: 'color', color: fromHex(color.toString('hexa')) }

    setWorking(color)
    emitted.current = next.color
    onChange(next)

    if (commit) {
      onCommit(next)
    }
  }

  const pick = (next: ColorValue): void => {
    const target = resolve(next, tokens)

    if (target !== null) {
      setWorking(parseColor(toHex(target)).toFormat('hsb'))
    }

    emitted.current = next.kind === 'color' ? next.color : null
    onChange(next)
    onCommit(next)
  }

  const commitDraft = (): void => {
    const typed = draft

    setDraft(null)

    if (typed !== null && isHex(typed)) {
      emit(parseColor(typed.trim()).toFormat('hsb'), true)
    }
  }

  const readout =
    background === undefined ? null : contrastReadout(working.toString('hex'), background)
  const summaryId = `${groupId}-summary`
  const contrastId = readout === null ? undefined : `${groupId}-contrast`
  const described = [describedBy, summaryId, contrastId].filter((part) => part !== undefined)

  return (
    <div
      id={groupId}
      // biome-ignore lint/a11y/useSemanticElements: a `fieldset` is named by a `legend`, and this group is named by the row's label; its `min-width: min-content` also breaks the panel's flex layout.
      role="group"
      aria-describedby={described.join(' ')}
      className={cn(colorPickerStyles(), className)}
      {...controlLabelProps(label, labelledBy)}
    >
      <ColorArea
        value={working}
        label={`${label} saturation and brightness`}
        disabled={disabled}
        onChange={(color) => emit(color, false)}
        onChangeEnd={(color) => emit(color, true)}
      />

      <ColorChannelSlider
        channel="hue"
        value={working}
        label={`${label} hue`}
        disabled={disabled}
        onChange={(color) => emit(color, false)}
        onChangeEnd={(color) => emit(color, true)}
      />

      {alpha ? (
        <ColorChannelSlider
          channel="alpha"
          value={working}
          label={`${label} opacity`}
          disabled={disabled}
          onChange={(color) => emit(color, false)}
          onChangeEnd={(color) => emit(color, true)}
        />
      ) : null}

      <span className="flex items-center gap-1">
        <Input
          aria-label={`${label} hex`}
          value={draft ?? working.toString(alpha ? 'hexa' : 'hex')}
          disabled={disabled}
          invalid={draft !== null && !isHex(draft)}
          className="min-w-0 flex-1"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft()
            }
          }}
        />
        {hasEyeDropper ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pick a colour from the screen"
            disabled={disabled}
            onClick={() => {
              void pickScreenColor().then((hex) => {
                if (hex !== null) {
                  emit(parseColor(hex).toFormat('hsb'), true)
                }
              })
            }}
          >
            <DropletIcon size={12} />
          </Button>
        ) : null}
      </span>

      <ColorPresets
        tokens={tokens}
        recent={recent}
        value={value}
        disabled={disabled}
        onPick={pick}
      />

      <span id={summaryId} className="text-2xs text-foreground-muted">
        {mixed ? 'Mixed' : speakColor(value, tokens)}
      </span>

      {readout === null ? null : (
        <output id={contrastId} className={contrastReadoutStyles({ level: readout.level })}>
          {readout.text}
        </output>
      )}
    </div>
  )
}

export const ColorPicker = memo(ColorPickerImpl)
