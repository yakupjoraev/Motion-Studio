import {
  dividerLabelledStyles,
  dividerRuleStyles,
  dividerStyles,
  dividerTextStyles,
} from './divider.styles'
import type { DividerProps } from './divider.types'

/**
 * Two forms, and the semantics follow the form: an unlabelled rule is an `<hr>`, which is a
 * separator on its own, and a labelled one is a `div` with `role="separator"` and an accessible name,
 * because an `<hr>` cannot hold text.
 */
export function Divider({ orientation, lineStyle, label, fade, spacing, hidden }: DividerProps) {
  if (label === '') {
    return <hr className={dividerStyles({ orientation, lineStyle, spacing, hidden })} />
  }

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: a separator is only focusable when it is a splitter the user can move, and this one is a rule
    <div
      aria-label={label}
      aria-orientation={orientation}
      className={dividerLabelledStyles({ spacing, hidden })}
      // biome-ignore lint/a11y/useSemanticElements: the semantic element is <hr>, which is the unlabelled branch above — an <hr> cannot hold the label
      role="separator"
    >
      <span aria-hidden className={dividerRuleStyles({ lineStyle, fade })} />
      <span className={dividerTextStyles()}>{label}</span>
      <span aria-hidden className={dividerRuleStyles({ lineStyle, fade })} />
    </div>
  )
}
