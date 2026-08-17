import { z } from 'zod'

import {
  ALT_MAX_LENGTH,
  HREF_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  MARQUEE_MAX_DURATION,
  MARQUEE_MIN_DURATION,
  sectionCopyFields,
  sectionFrameFields,
} from '../marketing.schema'

export const LOGO_MODES = ['grid', 'marquee'] as const

export type LogoMode = (typeof LOGO_MODES)[number]

export const MAX_LOGOS = 12
export const LOGO_MIN_COLUMNS = 2
export const LOGO_MAX_COLUMNS = 6

/**
 * `label` is the company's name and it is not optional, because it is doing two jobs: it is the image's
 * description, and it is what the cloud shows as a word-mark until a file arrives. A logo row full of
 * empty plates is the state this block would otherwise spend its first hour in.
 */
export const logoSchema = z.object({
  label: z.string().max(LABEL_MAX_LENGTH).default('Company'),
  src: z.string().max(HREF_MAX_LENGTH).default(''),
  alt: z.string().max(ALT_MAX_LENGTH).default(''),
})

export type Logo = z.infer<typeof logoSchema>

const logo = (label: string): Logo => ({ label, src: '', alt: '' })

const DEFAULT_LOGOS: readonly Logo[] = [
  logo('Northwind'),
  logo('Kestrel'),
  logo('Vellum'),
  logo('Halden'),
  logo('Lantern'),
  logo('Corvid'),
]

export const logoCloudSchema = z.object({
  ...sectionCopyFields({
    eyebrow: '',
    heading: 'Teams shipping with it',
    description: '',
  }),
  mode: z.enum(LOGO_MODES).default('grid'),
  columns: z.number().int().min(LOGO_MIN_COLUMNS).max(LOGO_MAX_COLUMNS).default(6),
  /**
   * Grey until hovered. On by default because a row of full-colour marks competes with the page's own
   * accent, and every one of them competes with the others.
   */
  grayscale: z.boolean().default(true),
  duration: z.number().int().min(MARQUEE_MIN_DURATION).max(MARQUEE_MAX_DURATION).default(30000),
  pauseOnHover: z.boolean().default(true),
  fadeEdges: z.boolean().default(true),
  logos: z
    .array(logoSchema)
    .min(1)
    .max(MAX_LOGOS)
    .default([...DEFAULT_LOGOS]),
  ...sectionFrameFields(),
})

export type LogoCloudProps = z.infer<typeof logoCloudSchema>

/**
 * What the image's `alt` should be. An empty `alt` on a company mark says "decorative", and a logo cloud
 * is the one place that is almost never true — the marks *are* the content. So the label stands in, and a
 * user who genuinely wants it decorative writes a space.
 */
export function logoAlt(entry: Logo): string {
  return entry.alt !== '' ? entry.alt : entry.label
}
