import { cva } from 'class-variance-authority'

/**
 * The blend is a class rather than an inline style: Tailwind emits these four and an exported
 * project gets the same rule the studio showed.
 */
export const noiseLayerStyles = cva('absolute inset-0 ms-fx-noise', {
  variants: {
    blend: {
      overlay: 'mix-blend-overlay',
      'soft-light': 'mix-blend-soft-light',
      multiply: 'mix-blend-multiply',
      screen: 'mix-blend-screen',
    },
  },
  defaultVariants: { blend: 'overlay' },
})
