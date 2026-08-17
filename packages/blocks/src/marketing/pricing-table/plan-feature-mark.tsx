import { CheckIcon, MinusIcon } from '@motion-studio/icons'

import { planFeatureMarkStyles } from './pricing-table.styles'

export interface PlanFeatureMarkProps {
  readonly included: boolean
}

/**
 * A tick or a dash, and the shape is the signal — not the colour.
 *
 * ACCESSIBILITY.md § Colour: a green dot and a grey dot are the same dot to a monochrome print, a
 * colour-blind reader and a low-contrast display. The glyph differs, so the answer survives all three.
 * The word is on the label beside it, so the icon itself is decorative.
 */
export function PlanFeatureMark({ included }: PlanFeatureMarkProps) {
  const Glyph = included ? CheckIcon : MinusIcon

  return (
    <span
      className={planFeatureMarkStyles({ included })}
      data-included={included}
      data-testid="plan-feature-mark"
    >
      <Glyph aria-hidden="true" size={12} />
    </span>
  )
}
