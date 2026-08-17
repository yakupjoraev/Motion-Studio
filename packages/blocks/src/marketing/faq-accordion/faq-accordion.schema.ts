import { z } from 'zod'

import { TITLE_MAX_LENGTH, sectionCopyFields, sectionFrameFields } from '../marketing.schema'

/** Radix's own two modes, under its own names, so the prop reads the same as the API it drives. */
export const FAQ_MODES = ['single', 'multiple'] as const

export type FaqMode = (typeof FAQ_MODES)[number]

export const MAX_FAQ_ITEMS = 12
export const FAQ_ANSWER_MAX_LENGTH = 600

export const faqItemSchema = z.object({
  question: z.string().max(TITLE_MAX_LENGTH).default('A question a reader actually has'),
  answer: z.string().max(FAQ_ANSWER_MAX_LENGTH).default('The answer, in two sentences at most.'),
})

export type FaqItem = z.infer<typeof faqItemSchema>

const DEFAULT_ITEMS: readonly FaqItem[] = [
  {
    question: 'Does the export really compile?',
    answer:
      'Yes. Every block is a typed React component, and the export emits the same tree with its imports, its classes and its motion. There is no runtime of ours in the output.',
  },
  {
    question: 'What happens to my animations outside the studio?',
    answer:
      'They come with you. A preset exports as variants and a transition, or as a keyframe block for the CSS-engine ones, and the reduced-motion handling comes with it.',
  },
  {
    question: 'Can I use my own design tokens?',
    answer:
      'The theme engine is the token layer. Export the tokens as CSS variables, Tailwind config or JSON, and the blocks read them wherever they run.',
  },
  {
    question: 'Is it accessible?',
    answer:
      'Keyboard paths, focus management and reduced motion are build gates rather than a later phase. Every block ships with its own accessibility notes.',
  },
]

export const faqAccordionSchema = z.object({
  ...sectionCopyFields({
    eyebrow: '',
    heading: 'Questions people ask first',
    description: '',
  }),
  mode: z.enum(FAQ_MODES).default('single'),
  /** Which panel starts open. `-1` starts them all closed, which is a real answer. */
  defaultOpen: z
    .number()
    .int()
    .min(-1)
    .max(MAX_FAQ_ITEMS - 1)
    .default(0),
  /**
   * Emit `FAQPage` JSON-LD **in the export**. Off by default: structured data that does not match the
   * page is a search penalty rather than a feature, and a user who has not read their own answers should
   * not be publishing them as schema.org claims.
   */
  jsonLd: z.boolean().default(false),
  items: z
    .array(faqItemSchema)
    .min(1)
    .max(MAX_FAQ_ITEMS)
    .default([...DEFAULT_ITEMS]),
  ...sectionFrameFields(),
})

export type FaqAccordionProps = z.infer<typeof faqAccordionSchema>

/** Radix identifies items by value; the index is what the document stores. */
export const faqItemValue = (index: number): string => `item-${index}`

const opensNothing = (defaultOpen: number, count: number): boolean =>
  defaultOpen < 0 || defaultOpen >= count

/**
 * Radix's `defaultValue` for each mode, and the two are separate functions because Radix types them
 * separately — a string for `single`, an array for `multiple`. One function returning the union would need
 * a cast at the call site, and § 1 of the contract has no room for one.
 *
 * "Nothing open" is the empty string rather than `undefined`: it matches no item's value, so every panel
 * starts closed, and it keeps the prop present — which `exactOptionalPropertyTypes` requires.
 */
export function faqSingleDefault(defaultOpen: number, count: number): string {
  return opensNothing(defaultOpen, count) ? '' : faqItemValue(defaultOpen)
}

export function faqMultipleDefault(defaultOpen: number, count: number): string[] {
  return opensNothing(defaultOpen, count) ? [] : [faqItemValue(defaultOpen)]
}
