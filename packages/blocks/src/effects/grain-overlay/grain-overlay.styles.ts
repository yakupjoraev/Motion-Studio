import { cva } from 'class-variance-authority'

/** Only the two blends that survive both colour modes; `multiply` on a dark surface erases the grain. */
export const grainLayerStyles = cva('ms-fx-grain', {
  variants: {
    blend: {
      overlay: 'mix-blend-overlay',
      'soft-light': 'mix-blend-soft-light',
    },
  },
  defaultVariants: { blend: 'overlay' },
})
