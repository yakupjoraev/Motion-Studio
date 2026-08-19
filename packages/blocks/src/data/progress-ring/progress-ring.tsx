import { RING_CAPTION, ringFrameStyles } from './progress-ring.styles'
import type { ProgressRingProps } from './progress-ring.types'
import { RingArc } from './ring-arc'
import { ringGeometry, ringValueText } from './ring-geometry'
import { RingReadout } from './ring-readout'

/**
 * A circular progress meter.
 *
 * `role="progressbar"` with the whole quartet — `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and
 * `aria-valuetext` — on one element, with everything inside it `aria-hidden`, so the value is announced once.
 * The arc and the figure are two views of the same number and a reader should get one of them.
 *
 * There is no state and no effect in here: the fill animates in CSS from a `from`-only keyframe over a token
 * duration, which is what makes reduced motion show the final value immediately rather than a slower one.
 */
export function ProgressRing({
  value,
  min,
  max,
  label,
  valueText,
  showValue,
  valueUnit,
  caption,
  size,
  weight,
  hidden,
}: ProgressRingProps) {
  const { percent, offset } = ringGeometry(value, min, max)

  return (
    <div className={ringFrameStyles({ hidden })} data-testid="progress-ring">
      {/* biome-ignore lint/a11y/useFocusableInteractive: a progressbar is read-only, so a tab stop here would announce a number and hand focus straight back — ACCESSIBILITY.md § Focus */}
      <div
        aria-label={label}
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        aria-valuetext={valueText === '' ? ringValueText(percent) : valueText}
        className="relative"
        data-testid="ring-meter"
        role="progressbar"
      >
        <RingArc offset={offset} size={size} weight={weight} />
        {showValue && <RingReadout size={size} unit={valueUnit} value={value} />}
      </div>

      {caption !== '' && <p className={RING_CAPTION}>{caption}</p>}
    </div>
  )
}
