import type { ReactNode } from 'react'

import { codeScrollStyles } from './code-block.styles'

export interface CodeScrollerProps {
  readonly label: string
  readonly wrap: boolean
  readonly children: ReactNode
}

/**
 * The scrollable region, and the two suppressions that come with it.
 *
 * ACCESSIBILITY.md § Scrollable regions asks for a labelled region the keyboard can focus. Both rules
 * are right in general and wrong here, for reasons written where each one fires.
 */
export function CodeScroller({ label, wrap, children }: CodeScrollerProps) {
  return (
    <pre
      aria-label={label}
      className={codeScrollStyles({ wrap })}
      data-testid="code-scroller"
      // biome-ignore lint/a11y/useSemanticElements: the semantic element would be <section>, which cannot replace <pre> — the white-space handling and the code semantics are what make a sample readable and copyable
      role="region"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or the part of the sample that is off-screen is unreachable from the keyboard
      tabIndex={0}
    >
      <code>{children}</code>
    </pre>
  )
}
