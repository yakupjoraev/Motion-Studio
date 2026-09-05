import { z } from 'zod'

import { alignment, visibility } from '../scales'

/**
 * The vocabulary the twelve marketing blocks share.
 *
 * Two things are shared here rather than transcribed twelve times, and both are single design
 * decisions in the same sense ADR-118 gives for the hero copy stack:
 *
 *   - the **section header** — eyebrow, heading, description — with its vertical rhythm;
 *   - the **heading level**, which is the prop that lets a block nest correctly. A block cannot know
 *     whether it sits under an `h1` or an `h3`, and guessing produces the document outline defect
 *     ACCESSIBILITY.md § Headings names: a page whose headings skip levels.
 */
export const HEADING_LEVELS = [2, 3, 4, 5, 6] as const

export type HeadingLevel = (typeof HEADING_LEVELS)[number]

/**
 * `h1` is not on the ladder. A marketing section sits under the page's hero, which owns the single
 * `h1` (COMPONENT_LIBRARY.md § Hero), so a section header that could claim `h1` would let a user
 * produce two of them from two blocks that each look correct on its own.
 */
export const headingLevel = z
  .union([z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)])
  .default(2)

/** The tag a level prints as, so nothing builds an element name by concatenation at render time. */
export const HEADING_TAGS = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const

/**
 * The level for a heading *inside* a section whose header is at `level` — a feature cell's title, a
 * plan's name, a question in the FAQ. One step down, and it stops at 6 rather than running off the end,
 * because ACCESSIBILITY.md § Headings forbids skipping a level and there is no `h7` to skip to.
 */
export function nextHeadingLevel(level: HeadingLevel): HeadingLevel {
  return level === 6 ? 6 : ((level + 1) as HeadingLevel)
}

export const EYEBROW_MAX_LENGTH = 64
export const HEADING_MAX_LENGTH = 160
export const DESCRIPTION_MAX_LENGTH = 400
export const TITLE_MAX_LENGTH = 96
export const BODY_MAX_LENGTH = 320
export const LABEL_MAX_LENGTH = 48
export const HREF_MAX_LENGTH = 2048

export interface SectionCopyDefaults {
  readonly eyebrow: string
  readonly heading: string
  readonly description: string
}

/**
 * A factory, for the reason `heroCopyFields` is one: the words differ per block and everything around
 * them is identical. An empty string in any of the three hides that line rather than leaving a gap.
 */
export const sectionCopyFields = (copy: SectionCopyDefaults) => ({
  eyebrow: z.string().max(EYEBROW_MAX_LENGTH).default(copy.eyebrow),
  heading: z.string().max(HEADING_MAX_LENGTH).default(copy.heading),
  description: z.string().max(DESCRIPTION_MAX_LENGTH).default(copy.description),
  headingLevel,
  headingAlign: alignment.default('center'),
})

/** What a shared `TypedControl` is checked against — the same device `HeroCopyShape` uses. */
export interface SectionCopyShape {
  readonly eyebrow: string
  readonly heading: string
  readonly description: string
  readonly headingLevel: HeadingLevel
  readonly headingAlign: 'start' | 'center' | 'end'
}

/** The band every marketing block draws itself in. `hidden` is responsive — ADR-117. */
export const sectionFrameFields = () => ({
  hidden: visibility,
})

export interface SectionFrameShape {
  readonly hidden: boolean
}

/**
 * How a card is painted. Three values rather than a boolean because the three are not degrees of one
 * thing: `plain` has no surface at all, `card` is a surface with a hairline, and `glass` needs
 * something behind it to blur — which is why a block offering it declares `requiresBackdrop`.
 */
export const CARD_TREATMENTS = ['plain', 'card', 'glass'] as const

export type CardTreatment = (typeof CARD_TREATMENTS)[number]

export const cardTreatment = z.enum(CARD_TREATMENTS)

/**
 * What a row of cards does when the band is too narrow to hold it — ADR-357.
 *
 * `slider` is the default because six stacked cards is a page a phone user scrolls past rather than
 * reads: the swipe keeps the set to one screen and the next card peeks in to say there is one. `stack`
 * stays available and is the honest choice for two or three cards, where a slider hides nothing.
 * Both are the block's own markup, so the export behaves like the preview.
 */
export const NARROW_LAYOUTS = ['slider', 'stack'] as const

export type NarrowLayout = (typeof NARROW_LAYOUTS)[number]

export const narrowLayout = z.enum(NARROW_LAYOUTS).default('slider')

export const ALT_MAX_LENGTH = 200

/**
 * Lengths and bounds two blocks share, kept here rather than in whichever of them happened to be written
 * first. `logo-cloud` needs the marquee's duration bounds and `testimonial-marquee` needs the testimonial
 * card's field lengths — reaching into a sibling block's schema for them would pull that block's component
 * into this one's module graph, and § 3 of the contract forbids the import anyway.
 */
export const TESTIMONIAL_QUOTE_MAX_LENGTH = 600
export const TESTIMONIAL_ATTRIBUTION_MAX_LENGTH = 80

/** One full marquee cycle. The floor is above the 3 Hz flash limit by three orders of magnitude. */
export const MARQUEE_MIN_DURATION = 8000
export const MARQUEE_MAX_DURATION = 60000

/**
 * A picture inside a marketing block. The same contract `content/image` states, and for its reasons:
 * `alt` is **required** and may be empty — a decorative image and an undescribed one look identical in
 * markup, so the schema refuses to let the question go unanswered — and `width`/`height`/`sizes` are
 * real values because COMPONENT_LIBRARY.md § Rules 10 asks for them and CLS is what pays otherwise.
 */
export const mediaSchema = z.object({
  src: z.string().max(HREF_MAX_LENGTH).default(''),
  alt: z.string().max(ALT_MAX_LENGTH),
  width: z.number().int().min(1).max(8192).default(1600),
  height: z.number().int().min(1).max(8192).default(1000),
  sizes: z.string().max(200).default('(min-width: 1024px) 50vw, 100vw'),
})

export type Media = z.infer<typeof mediaSchema>

export const ACTION_VARIANTS = ['primary', 'secondary', 'ghost'] as const

export type ActionVariant = (typeof ACTION_VARIANTS)[number]

/**
 * A call to action. An empty `href` renders a `<button>` rather than an `<a>` — the hero's rule, and for
 * its reason: Enter on a link and Space on a button are different promises, and only the element says
 * which the reader is looking at.
 *
 * This is deliberately *not* imported from `hero/index`. The hero barrel exports its `definitions` and
 * `components` maps, so importing the shape through it would pull all six hero blocks into the marketing
 * category's module graph and into whichever chunk loads first. The shape is four lines; the coupling
 * would be six blocks.
 */
export const actionSchema = z.object({
  label: z.string().max(LABEL_MAX_LENGTH).default('Get started'),
  href: z.string().max(HREF_MAX_LENGTH).default('#'),
  variant: z.enum(ACTION_VARIANTS).default('primary'),
})

export type Action = z.infer<typeof actionSchema>

export const MAX_ACTIONS = 2
