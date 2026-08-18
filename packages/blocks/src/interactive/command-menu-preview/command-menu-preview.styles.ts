import { cva } from 'class-variance-authority'

export const commandRootStyles = cva('w-full min-w-0', {
  variants: { hidden: { true: 'hidden', false: 'block' } },
  defaultVariants: { hidden: false },
})

/**
 * The panel. `ms-glass` when the author asks for it, so it follows the document's own glass recipe rather than a
 * blur this block picked — the rule `blocks.css` states beside that class.
 */
export const commandPanelStyles = cva(
  'mx-auto w-full max-w-md overflow-hidden rounded-xl shadow-lg',
  {
    variants: {
      glass: { true: 'ms-glass', false: 'border border-border-strong bg-surface-1' },
    },
    defaultVariants: { glass: false },
  },
)

export const COMMAND_SEARCH =
  'flex items-center gap-2.5 border-border border-b px-4 py-3 text-foreground-muted text-md'

export const COMMAND_LIST = 'm-0 flex list-none flex-col gap-0.5 p-2'

export const COMMAND_GROUP_HEADING =
  'm-0 px-2 pt-2 pb-1 font-medium text-foreground-muted text-sm uppercase tracking-[0.08em]'

/**
 * A row. The first one is drawn as the highlighted one, because a palette screenshot with nothing selected
 * looks like a palette that has not loaded.
 */
export const commandRowStyles = cva(
  'flex items-center justify-between gap-3 rounded-md px-2 py-2 text-base',
  {
    variants: {
      active: { true: 'bg-surface-2 text-foreground', false: 'text-foreground-muted' },
    },
    defaultVariants: { active: false },
  },
)

export const COMMAND_ROW_LABEL = 'inline-flex min-w-0 items-center gap-2.5'

/** A keycap. `text-2xs` and tabular figures, so ⌘E and Space sit on the same baseline grid. */
export const COMMAND_HINT =
  'shrink-0 rounded-xs border border-border bg-surface-2 px-1.5 py-0.5 font-medium text-2xs text-foreground-muted [font-variant-numeric:tabular-nums]'
