import { cva } from 'class-variance-authority'

/**
 * The measure is a literal `max-w-[NNch]` per step rather than a computed one, for ADR-106's reason:
 * Tailwind emits an arbitrary value only when it can see the literal in the source, and a number read
 * out of a document at runtime is never literal at build time. `MEASURE_CH` in the schema is the same
 * table as a number, and the block's test asserts the two agree.
 */
export const textStyles = cva('@container/frame mb-0 text-pretty', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-foreground-muted',
      subtle: 'text-foreground-subtle',
    },
    measure: {
      narrow: 'max-w-[55ch]',
      default: 'max-w-[68ch]',
      wide: 'max-w-[75ch]',
      full: 'max-w-none',
    },
    align: {
      start: 'text-left',
      center: 'mx-auto text-center',
      end: 'ml-auto text-right',
    },
    columns: {
      1: 'columns-1',
      2: 'columns-1 gap-10 @min-[768px]/frame:columns-2',
      3: 'columns-1 gap-10 @min-[768px]/frame:columns-2 @min-[1024px]/frame:columns-3',
    },
    /**
     * `::first-letter` rather than a wrapped span: a span would put the letter in the text content,
     * so a screen reader would read it separately and a copy would carry the markup.
     */
    dropCap: {
      true: 'first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-semibold first-letter:text-5xl first-letter:text-foreground first-letter:leading-none',
      false: '',
    },
    balance: { true: 'text-balance', false: '' },
    hidden: { true: 'hidden', false: 'block' },
  },
})
