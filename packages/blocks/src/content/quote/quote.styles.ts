import { cva } from 'class-variance-authority'

/**
 * A pull quote is one typographic step above the body it interrupts, and nothing else. The three mark
 * options are the three honest ways to say "this is quoted": a rule beside it, a glyph behind it, or
 * the size alone. A decorative glyph is `aria-hidden` and sits at low contrast on purpose — a quotation
 * mark that competes with the words is a quotation mark somebody will read aloud.
 */
export const quoteStyles = cva('@container/frame relative m-0 flex flex-col', {
  variants: {
    mark: {
      rule: 'border-accent border-l-2 pl-6',
      // The glyph is drawn above the first line, so the figure has to make room for it. Without the
      // padding it is clipped by whatever contains the block — measured in a 900 px story frame,
      // where the top half of the mark was cut off.
      glyph: 'pt-8 pl-0',
      none: 'pl-0',
    },
    align: {
      start: 'items-start text-left',
      center: 'items-center text-center',
      end: 'items-end text-right',
    },
    hidden: { true: 'hidden', false: 'flex' },
  },
})

export const quoteTextStyles = cva('m-0 text-balance text-foreground', {
  variants: {
    size: {
      md: 'text-lg',
      lg: 'text-xl @min-[768px]/frame:text-2xl',
      xl: 'text-2xl @min-[768px]/frame:text-3xl',
    },
  },
})

export const QUOTE_GLYPH =
  'pointer-events-none absolute top-0 left-0 select-none font-semibold text-6xl text-accent/20 leading-none'

export const QUOTE_FOOTER = 'mt-5 flex items-center gap-3'

export const QUOTE_AVATAR = 'size-10 shrink-0 rounded-full border border-border object-cover'

export const QUOTE_INITIAL =
  'flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-medium text-foreground-muted text-sm'

export const QUOTE_AUTHOR = 'font-medium text-foreground text-sm'

export const QUOTE_ROLE = 'text-foreground-subtle text-sm'
