import { cva } from 'class-variance-authority'

import type { TokenKind } from './highlight'

export const codeBlockStyles = cva(
  'relative w-full overflow-hidden rounded-lg border border-border bg-surface-inset',
  {
    variants: {
      hidden: { true: 'hidden', false: 'block' },
    },
  },
)

export const CODE_BAR =
  'flex items-center justify-between gap-3 border-border border-b bg-surface-1 px-4 py-2'

export const CODE_FILENAME = 'truncate font-mono text-foreground-subtle text-xs'

/**
 * `tabindex=0` plus a role and a label — ACCESSIBILITY.md § Scrollable regions. A pre that scrolls and
 * is not focusable is content a keyboard cannot reach, which is the most common quiet failure in a
 * documentation page.
 */
export const codeScrollStyles = cva('m-0 overflow-auto p-4 font-mono text-sm leading-[1.7]', {
  variants: {
    wrap: {
      true: 'whitespace-pre-wrap break-words',
      false: 'whitespace-pre',
    },
  },
})

export const CODE_LINE = 'grid grid-cols-[auto_1fr] gap-4'

export const CODE_LINE_HIGHLIGHTED = 'bg-accent/10 shadow-[inset_2px_0_0_0_var(--ms-color-accent)]'

export const CODE_LINE_NUMBER = 'select-none text-right text-foreground-subtle tabular-nums'

/** Five colours, which is what makes structure legible; a sixth is decoration. */
export const TOKEN_CLASS: Readonly<Record<TokenKind, string>> = {
  comment: 'text-foreground-subtle italic',
  string: 'text-success',
  number: 'text-warning',
  keyword: 'text-accent',
  plain: 'text-foreground',
}

export const CODE_COPY =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2 font-medium text-foreground-muted text-xs transition-colors [transition-duration:var(--ms-duration-fast)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2'
