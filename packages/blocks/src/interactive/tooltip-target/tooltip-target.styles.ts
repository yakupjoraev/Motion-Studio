import { cva } from 'class-variance-authority'

export const tooltipRootStyles = cva('relative isolate inline-flex', {
  variants: { hidden: { true: 'hidden', false: 'inline-flex' } },
  defaultVariants: { hidden: false },
})

/**
 * The bubble.
 *
 * It is **always in the DOM** and always the target of `aria-describedby`, which is the half a bubble that
 * mounts on hover gets wrong: a description that only exists while the pointer is over the control is a
 * description a screen-reader user never has. Visibility is opacity and scale rather than `hidden` or
 * `visibility`, because both of those take the element out of the accessibility tree and with it the
 * description.
 *
 * `pointer-events` is the one thing that does switch: a bubble the pointer can hit while it is invisible would
 * block the control underneath it.
 */
export const tooltipBubbleStyles = cva(
  [
    'absolute z-30 w-max max-w-56 rounded-md border border-border bg-surface-2 px-2.5 py-1.5',
    'text-base text-foreground shadow-md',
    'transition-[opacity,scale] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]',
  ].join(' '),
  {
    variants: {
      side: {
        top: '-translate-x-1/2 bottom-full left-1/2 mb-2 origin-bottom',
        bottom: '-translate-x-1/2 top-full left-1/2 mt-2 origin-top',
        left: '-translate-y-1/2 top-1/2 right-full mr-2 origin-right',
        right: '-translate-y-1/2 top-1/2 left-full ml-2 origin-left',
      },
      open: {
        true: 'scale-100 opacity-100',
        false: 'pointer-events-none scale-95 opacity-0',
      },
    },
    defaultVariants: { side: 'top', open: false },
  },
)
