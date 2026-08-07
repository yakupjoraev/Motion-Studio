import { type ReactElement, useRef } from 'react'
import { VisuallyHidden, useColorArea } from 'react-aria'
import { type Color, useColorAreaState } from 'react-stately'

import { colorAreaStyles, colorThumbStyles } from './color-picker.styles'

export interface ColorAreaProps {
  readonly value: Color
  readonly onChange: (color: Color) => void
  readonly onChangeEnd: (color: Color) => void
  readonly label: string
  readonly disabled: boolean
}

/**
 * Saturation across, brightness down — prompt 09 § ColorPicker requires React Aria's hook rather than a
 * hand-rolled version, because the two-axis pointer maths and the two hidden range inputs that make it
 * keyboard-operable are exactly what gets got wrong by hand.
 *
 * The gradient background and the thumb position both come out of the hook; the only thing this
 * component decides is what it looks like.
 */
export function ColorArea({
  value,
  onChange,
  onChangeEnd,
  label,
  disabled,
}: ColorAreaProps): ReactElement {
  const inputXRef = useRef<HTMLInputElement>(null)
  const inputYRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const channels = { xChannel: 'saturation', yChannel: 'brightness' } as const
  const state = useColorAreaState({
    ...channels,
    value,
    onChange,
    onChangeEnd,
    isDisabled: disabled,
  })

  const { colorAreaProps, thumbProps, xInputProps, yInputProps } = useColorArea(
    { ...channels, 'aria-label': label, isDisabled: disabled, inputXRef, inputYRef, containerRef },
    state,
  )

  const { x, y } = state.getThumbPosition()

  return (
    <div
      {...colorAreaProps}
      ref={containerRef}
      className={colorAreaStyles()}
      style={{ ...colorAreaProps.style, opacity: disabled ? 0.5 : undefined }}
    >
      <div
        {...thumbProps}
        className={colorThumbStyles()}
        style={{
          ...thumbProps.style,
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          background: state.getDisplayColor().toString('css'),
        }}
      >
        <VisuallyHidden>
          <input ref={inputXRef} {...xInputProps} />
          <input ref={inputYRef} {...yInputProps} />
        </VisuallyHidden>
      </div>
    </div>
  )
}
