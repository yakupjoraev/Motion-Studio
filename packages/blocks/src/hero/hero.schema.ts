import { z } from 'zod'

import { alignment, maxWidthScale, minHeightScale, spaceScale, visibility } from '../scales'

/**
 * The vocabulary all six heroes share. ADR-118: the copy stack is one module rather than six copies,
 * because the vertical rhythm the prompt specifies — eyebrow 24 headline 24 subtitle 40 CTAs — is a
 * single design decision, and six transcriptions of it drift on the first edit.
 */
export const CTA_VARIANTS = ['primary', 'secondary', 'ghost'] as const

export type CtaVariant = (typeof CTA_VARIANTS)[number]

export const EYEBROW_STYLES = ['pill', 'plain'] as const

export type EyebrowStyle = (typeof EYEBROW_STYLES)[number]

export const EYEBROW_MAX_LENGTH = 64
export const HEADLINE_MAX_LENGTH = 160
export const SUBTITLE_MAX_LENGTH = 400
export const LABEL_MAX_LENGTH = 48
export const HREF_MAX_LENGTH = 2048

/** An empty `href` is the honest way to say "this does something on the page" — it renders a button. */
export const ctaSchema = z.object({
  label: z.string().max(LABEL_MAX_LENGTH).default('Get started'),
  href: z.string().max(HREF_MAX_LENGTH).default('#'),
  variant: z.enum(CTA_VARIANTS).default('primary'),
})

export type Cta = z.infer<typeof ctaSchema>

export const trustItemSchema = z.object({
  label: z.string().max(LABEL_MAX_LENGTH).default('Trusted by teams'),
})

export type TrustItem = z.infer<typeof trustItemSchema>

export const MAX_ACTIONS = 3
export const MAX_TRUST_ITEMS = 5

export interface HeroCopyDefaults {
  readonly eyebrow: string
  readonly headline: string
  readonly subtitle: string
  readonly actions: readonly Cta[]
}

/**
 * A factory rather than a constant: every hero carries different words, and words are the part of a
 * default that has to be written per block. Everything around them is identical by construction.
 */
export const heroCopyFields = (copy: HeroCopyDefaults) => ({
  eyebrow: z.string().max(EYEBROW_MAX_LENGTH).default(copy.eyebrow),
  eyebrowStyle: z.enum(EYEBROW_STYLES).default('pill'),
  headline: z.string().max(HEADLINE_MAX_LENGTH).default(copy.headline),
  subtitle: z.string().max(SUBTITLE_MAX_LENGTH).default(copy.subtitle),
  actions: z
    .array(ctaSchema)
    .max(MAX_ACTIONS)
    .default([...copy.actions]),
})

export const heroTrustField = (items: readonly TrustItem[]) =>
  z
    .array(trustItemSchema)
    .max(MAX_TRUST_ITEMS)
    .default([...items])

/** The band itself: a hero is a `<section>`, so it holds the same frame props a section does. */
export const heroFrameFields = (frame: {
  readonly align: 'start' | 'center' | 'end'
  readonly minHeight: 'auto' | 'half' | 'three-quarters' | 'screen'
}) => ({
  align: alignment.default(frame.align),
  /** `xl` rather than the section's `lg`: a hero is the widest thing on the page it opens. */
  maxWidth: maxWidthScale.default('xl'),
  padding: spaceScale.default('xl'),
  minHeight: minHeightScale.default(frame.minHeight),
  hidden: visibility,
})

/**
 * The shapes the shared controls are checked against. Written out rather than inferred because they
 * are what makes a shared `TypedControl` legal: a control whose path is `'headline'` is assignable to
 * every block whose own props declare `headline`, and the compiler checks exactly that.
 */
export interface HeroCopyShape {
  readonly eyebrow: string
  readonly eyebrowStyle: EyebrowStyle
  readonly headline: string
  readonly subtitle: string
  readonly actions: readonly Cta[]
}

export interface HeroTrustShape {
  readonly trust: readonly TrustItem[]
}

export interface HeroFrameShape {
  readonly align: 'start' | 'center' | 'end'
  readonly maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  readonly padding: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  readonly minHeight: 'auto' | 'half' | 'three-quarters' | 'screen'
  readonly hidden: boolean
}
