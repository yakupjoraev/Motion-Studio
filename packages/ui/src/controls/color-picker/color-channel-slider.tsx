import { type ReactElement, useRef } from 'react'
import { VisuallyHidden, useColorSlider, useLocale } from 'react-aria'
import { type Color, type ColorChannel, useColorSliderState } from 'react-stately'

import { colorThumbStyles, colorTrackStyles } from './color-picker.styles'

export interface ColorChannelSliderProps {
  readonly channel: ColorChannel
  readonly value: Color
  readonly onChange: (color: Color) => void
  readonly onChangeEnd: (color: Color) => void
  readonly label: string
  readonly disabled: boolean
}

/**
 * One channel — hue or alpha. React Aria's hook again, for the same reason as the area, plus the
 * channel-aware `aria-valuetext` it produces ("120°", "48%") that a hand-rolled slider would have to
 * spell out per channel.
 */
export function ColorChannelSlider({
  channel,
  value,
  onChange,
  onChangeEnd,
  label,
  disabled,
}: ColorChannelSliderProps): ReactElement {
  const trackRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { locale } = useLocale()

  const state = useColorSliderState({
    channel,
    value,
    onChange,
    onChangeEnd,
    locale,
    isDisabled: disabled,
  })

  const { trackProps, thumbProps, inputProps } = useColorSlider(
    { channel, 'aria-label': label, isDisabled: disabled, trackRef, inputRef },
    state,
  )

  return (
    <div
      {...trackProps}
      ref={trackRef}
      className={colorTrackStyles()}
      style={{ ...trackProps.style, opacity: disabled ? 0.5 : undefined }}
    >
      <div
        {...thumbProps}
        className={colorThumbStyles()}
        style={{
          ...thumbProps.style,
          top: '50%',
          background: state.getDisplayColor().toString('css'),
        }}
      >
        <VisuallyHidden>
          <input ref={inputRef} {...inputProps} />
        </VisuallyHidden>
      </div>
    </div>
  )
}
