import { cva } from 'class-variance-authority'

/** `flex-1` in fluid mode, which is why the block declares a flex parent — ADR-115. */
export const spacerStyles = cva('w-full shrink-0', {
  variants: {
    height: {
      sm: 'h-4',
      md: 'h-8',
      lg: 'h-16',
      xl: 'h-24',
      '2xl': 'h-32',
    },
    mode: { fixed: '', fluid: 'h-0 flex-1' },
    hidden: { true: 'hidden', false: 'block' },
  },
})
