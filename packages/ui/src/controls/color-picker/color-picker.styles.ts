import { cva } from 'class-variance-authority'

import { FOCUS_RING, TRANSITION_CONTROL } from '../../styles/variants'

/** The alpha checkerboard § Control rows asks for, as a background any swatch can sit on. */
export const CHECKERBOARD =
  'bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0] bg-[image:linear-gradient(45deg,var(--ms-color-surface-3)_25%,transparent_25%),linear-gradient(-45deg,var(--ms-color-surface-3)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--ms-color-surface-3)_75%),linear-gradient(-45deg,transparent_75%,var(--ms-color-surface-3)_75%)]'

export const colorAreaStyles = cva('relative h-[132px] w-full rounded-sm border border-border')

export const colorThumbStyles = cva([
  'absolute h-[12px] w-[12px] rounded-full border-2 border-white shadow-sm',
  '-translate-x-1/2 -translate-y-1/2',
  FOCUS_RING,
  TRANSITION_CONTROL,
])

export const colorTrackStyles = cva([
  'relative h-[10px] w-full rounded-full border border-border',
  CHECKERBOARD,
])

export const colorSwatchStyles = cva(
  ['relative h-[20px] w-[20px] shrink-0 rounded-sm border border-border', CHECKERBOARD],
  {
    variants: {
      selected: { true: 'ring-1 ring-accent ring-offset-1 ring-offset-surface-1', false: '' },
    },
    defaultVariants: { selected: false },
  },
)

export const colorPickerStyles = cva('flex w-[220px] flex-col gap-2')

/** Value, not hue: a pass and a fail are told apart by the word, and the tone only reinforces it. */
export const contrastReadoutStyles = cva('text-2xs', {
  variants: {
    level: { AAA: 'text-foreground-muted', AA: 'text-foreground-muted', fail: 'text-danger' },
  },
  defaultVariants: { level: 'AA' },
})
