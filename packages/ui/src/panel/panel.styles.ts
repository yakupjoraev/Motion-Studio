import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { PANEL_SURFACE } from '../styles/variants'

/** One edge only, the one facing the canvas. No width: § Layout gives ranges, and `Resizable` drags it. */
export const panelStyles = cva(['flex min-h-0 flex-col overflow-hidden', PANEL_SURFACE], {
  variants: {
    side: {
      left: 'border-r',
      right: 'border-l',
    },
  },
  defaultVariants: { side: 'left' },
})

/** The tab strip's height: a header and a tab strip occupy the same band, and one replaces the other. */
export const panelHeaderStyles = cva([
  'flex shrink-0 items-center gap-2 border-border border-b px-2',
  'font-medium text-foreground text-xs',
  HEIGHT_CLASS.tabStrip,
])

/** A hairline between sections, none after the last. */
export const panelSectionStyles = cva(['border-border border-b last:border-b-0'])

/** Goes inside the collapsing box, never on it: height animates, padding does not, so it would stop at 16 px. */
export const panelSectionContentStyles = cva(['flex flex-col gap-1 p-2 pt-0'])

export type PanelStyleProps = VariantProps<typeof panelStyles>
