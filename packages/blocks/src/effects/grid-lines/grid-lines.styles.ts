import { cva } from 'class-variance-authority'

/**
 * One axis or both. `background-image` cannot be varied per axis from a single class, so the axis
 * chooses which of the two gradients is painted — the class list stays literal and Tailwind-free.
 */
export const gridLinesStyles = cva('absolute inset-0 ms-fx-lines', {
  variants: {
    axis: {
      both: '',
      horizontal: 'ms-fx-lines-h',
      vertical: 'ms-fx-lines-v',
    },
    fade: { true: 'ms-fx-fade', false: '' },
  },
  defaultVariants: { axis: 'both', fade: true },
})
