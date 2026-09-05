import { cva } from 'class-variance-authority'

/**
 * The gradient variant paints the text with the accent ramp. It is a background clipped to the
 * glyphs rather than a colour, so it needs `text-transparent` — and the token pair is the theme's,
 * which is what keeps it readable in both colour modes.
 */
export const headingStyles = cva('@container/frame m-0', {
  variants: {
    size: {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-2xl',
      xl: 'text-3xl @min-[768px]/frame:text-4xl',
      '2xl': 'text-4xl @min-[768px]/frame:text-5xl',
      '3xl': 'text-5xl @min-[768px]/frame:text-6xl',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      start: 'text-left',
      center: 'text-center',
      end: 'text-right',
    },
    tracking: {
      tight: 'tracking-tight',
      normal: 'tracking-normal',
      wide: 'tracking-wide',
    },
    balance: {
      true: 'text-balance',
      false: '',
    },
    gradient: {
      true: 'bg-gradient-to-br from-accent to-accent-hover bg-clip-text text-transparent',
      false: 'text-foreground',
    },
  },
})
