import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { PANEL_SURFACE } from '../styles/variants'

/**
 * The panel frame. Flat by design — § Character: "no shadows in the panels, depth comes from value, not from
 * elevation". The only edge it draws is the one facing the canvas, so two panels and the canvas between them
 * produce two hairlines rather than four.
 *
 * No width here. § Layout gives the panels ranges rather than a number, and the width is the app's, persisted
 * and dragged by `Resizable`.
 */
export const panelStyles = cva(['flex min-h-0 flex-col overflow-hidden', PANEL_SURFACE], {
  variants: {
    side: {
      left: 'border-r',
      right: 'border-l',
    },
  },
  defaultVariants: { side: 'left' },
})

/**
 * The panel's own title row. 36 px — the tab strip's height from § Density scale, because a panel header and
 * a panel tab strip occupy the same band and one replaces the other.
 */
export const panelHeaderStyles = cva([
  'flex shrink-0 items-center gap-2 border-border border-b px-2',
  'font-medium text-foreground text-xs',
  HEIGHT_CLASS.tabStrip,
])

/** The section separator. A hairline between sections, and none after the last one. */
export const panelSectionStyles = cva(['border-border border-b last:border-b-0'])

/**
 * Sections pad their own body, so a caller drops control rows in without measuring anything.
 *
 * This is applied to an element *inside* the collapsing box, never to the box itself: the animation moves
 * `height` and leaves `padding` alone, so a padded collapsing box stops at 16 px instead of at 0.
 */
export const panelSectionContentStyles = cva(['flex flex-col gap-1 p-2 pt-0'])

export type PanelStyleProps = VariantProps<typeof panelStyles>
