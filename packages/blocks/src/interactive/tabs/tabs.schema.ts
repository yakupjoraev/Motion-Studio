import { z } from 'zod'

import { labelledFrameFields, panelItemSchema } from '../interactive.schema'

/**
 * Six, and the reason is the indicator: the triggers are equal columns (ADR-203), and past six a column is
 * too narrow for a two-word label at 360 px — which is where the equal-column trade stops being neutral.
 */
export const MAX_TABS = 6
export const MIN_TABS = 2

export const TAB_ORIENTATIONS = ['horizontal', 'vertical'] as const

export type TabOrientation = (typeof TAB_ORIENTATIONS)[number]

/** How the list sits in the width it is given. The columns stay equal in all three. */
export const TAB_ALIGNMENTS = ['stretch', 'start', 'center'] as const

export type TabAlignment = (typeof TAB_ALIGNMENTS)[number]

export const tabsSchema = z.object({
  items: z
    .array(panelItemSchema)
    .min(MIN_TABS)
    .max(MAX_TABS)
    .default([
      {
        label: 'Overview',
        icon: '',
        body: 'A visual editor for React interfaces: an infinite canvas, a registry of production blocks, and a code generator that emits what you see.',
      },
      {
        label: 'Motion',
        icon: '',
        body: 'Presets per channel — entrance, hover, scroll, exit — composed rather than stacked, and every one of them honours reduced motion.',
      },
      {
        label: 'Export',
        icon: '',
        body: 'React, Next, or plain HTML, with Tailwind classes and no editor artifacts left in the markup.',
      },
      {
        label: 'Tokens',
        icon: '',
        body: 'One theme drives colour, radius, spacing, elevation and motion, and the export carries the same variables.',
      },
    ]),
  orientation: z.enum(TAB_ORIENTATIONS).default('horizontal'),
  /**
   * `start` rather than `stretch`, and the reason is the indicator: the columns are equal (ADR-203), so a
   * stretched strip at 1440 gives each of four tabs a 340 px column and draws a 340 px underline beneath a
   * 60 px label. Hugging the labels keeps the indicator the width of the thing it marks.
   */
  align: z.enum(TAB_ALIGNMENTS).default('start'),
  /** Which panel opens first, as an index. Out of range falls back to the first — a document is user data. */
  defaultTab: z
    .number()
    .int()
    .min(0)
    .max(MAX_TABS - 1)
    .default(0),
  ...labelledFrameFields('Sections'),
})

export type TabsProps = z.infer<typeof tabsSchema>

/** Radix keys a tab by value; the value is the index, so two tabs with one label stay two tabs. */
export const tabValue = (index: number): string => `tab-${index}`

export const tabIndex = (value: string): number => {
  const parsed = Number.parseInt(value.replace('tab-', ''), 10)

  return Number.isFinite(parsed) ? parsed : 0
}

/** Clamped rather than validated: `defaultTab` may outlive the item it pointed at. */
export const initialTab = (defaultTab: number, count: number): number =>
  defaultTab >= 0 && defaultTab < count ? defaultTab : 0
