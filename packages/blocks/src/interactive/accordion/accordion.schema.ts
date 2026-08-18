import { z } from 'zod'

import { HEADING_LEVELS, headingLevel } from '../../marketing/marketing.schema'
import { labelledFrameFields, panelItemSchema } from '../interactive.schema'

export const MAX_ACCORDION_ITEMS = 8
export const MIN_ACCORDION_ITEMS = 1

/** Radix's own two modes, under its own names, so the prop reads the same as the API it drives. */
export const ACCORDION_MODES = ['single', 'multiple'] as const

export type AccordionMode = (typeof ACCORDION_MODES)[number]

export const ACCORDION_LOOKS = ['list', 'cards'] as const

export type AccordionLook = (typeof ACCORDION_LOOKS)[number]

export const accordionSchema = z.object({
  items: z
    .array(panelItemSchema)
    .min(MIN_ACCORDION_ITEMS)
    .max(MAX_ACCORDION_ITEMS)
    .default([
      {
        label: 'What the canvas is',
        icon: '',
        body: 'An infinite artboard with real blocks on it: zoom, pan, snap and guides, and every node is the component it will export as.',
      },
      {
        label: 'How motion is stored',
        icon: '',
        body: 'A node holds one spec per channel — a preset id, a trigger and its params — so an animation is data the inspector edits rather than code a block hides.',
      },
      {
        label: 'What the export contains',
        icon: '',
        body: 'The same tree, with Tailwind classes, hoisted variants, and no editor artifacts left in the markup.',
      },
    ]),
  mode: z.enum(ACCORDION_MODES).default('single'),
  look: z.enum(ACCORDION_LOOKS).default('list'),
  /** Which row starts open, as an index. `-1` starts with all of them closed. */
  defaultOpen: z
    .number()
    .int()
    .min(-1)
    .max(MAX_ACCORDION_ITEMS - 1)
    .default(0),
  /**
   * The level the row headings print at. Radix wraps every trigger in a heading, and a heading that ignored
   * the page around it would skip a level — ACCESSIBILITY.md § Headings.
   */
  headingLevel: headingLevel.default(3),
  ...labelledFrameFields('Details'),
})

export type AccordionProps = z.infer<typeof accordionSchema>

export const accordionValue = (index: number): string => `panel-${index}`

export const ACCORDION_HEADING_LEVELS = HEADING_LEVELS

/** What Radix's uncontrolled root starts with: a string for `single`, an array for `multiple`. */
export const singleOpen = (index: number, count: number): string | undefined =>
  index >= 0 && index < count ? accordionValue(index) : undefined

export const multipleOpen = (index: number, count: number): readonly string[] => {
  const value = singleOpen(index, count)

  return value === undefined ? [] : [value]
}
