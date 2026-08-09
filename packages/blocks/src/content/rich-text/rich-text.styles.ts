import { cva } from 'class-variance-authority'

/**
 * The prose styles are applied to the block's own elements rather than through a descendant-selector
 * plugin, for one reason: the elements are a closed set. There are five of them — paragraph, list,
 * item, link, code — and naming each one is shorter than depending on something that styles whatever
 * happens to be inside.
 */
export const richTextStyles = cva('flex flex-col gap-4', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-md',
      lg: 'text-lg',
    },
    measure: {
      narrow: 'max-w-[55ch]',
      default: 'max-w-[68ch]',
      wide: 'max-w-[75ch]',
      full: 'max-w-none',
    },
    align: {
      start: 'items-start text-left',
      center: 'mx-auto items-center text-center',
      end: 'ml-auto items-end text-right',
    },
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const RICH_TEXT_PARAGRAPH = 'm-0 text-pretty text-foreground-muted'

export const RICH_TEXT_LIST = 'm-0 flex list-outside flex-col gap-2 pl-5 text-foreground-muted'

export const RICH_TEXT_ORDERED = `${RICH_TEXT_LIST} list-decimal`

export const RICH_TEXT_UNORDERED = `${RICH_TEXT_LIST} list-disc`

export const RICH_TEXT_LINK =
  'text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent'

export const RICH_TEXT_CODE =
  'rounded-xs border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground'
