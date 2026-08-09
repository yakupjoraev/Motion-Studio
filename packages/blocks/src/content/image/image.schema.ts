import { z } from 'zod'

import { visibility } from '../../scales'

export const ASPECTS = ['auto', 'square', 'video', 'portrait', 'wide'] as const

export type Aspect = (typeof ASPECTS)[number]

export const FITS = ['cover', 'contain'] as const

export type Fit = (typeof FITS)[number]

export const IMAGE_RADII = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const

export type ImageRadius = (typeof IMAGE_RADII)[number]

export const URL_MAX_LENGTH = 2048
export const ALT_MAX_LENGTH = 200
export const CAPTION_MAX_LENGTH = 300

/**
 * `alt` is **required**, and an empty string is a legal value. That pairing is the whole point: a
 * decorative image and an undescribed one look identical in the markup, so the schema refuses to let a
 * user skip the question. Empty means *"I decided this is decorative"*; missing fails to parse.
 *
 * `imageNeedsAlt` is what the inspector's warning chip and the export report read — a block cannot
 * refuse to render while somebody is halfway through choosing a file.
 */
export const imageSchema = z.object({
  src: z.string().max(URL_MAX_LENGTH).default(''),
  alt: z.string().max(ALT_MAX_LENGTH),
  width: z.number().int().min(1).max(8192).default(1600),
  height: z.number().int().min(1).max(8192).default(1000),
  /** A real `sizes` value. `100vw` is the honest default: a block cannot see its parent's layout. */
  sizes: z.string().max(200).default('100vw'),
  aspect: z.enum(ASPECTS).default('auto'),
  fit: z.enum(FITS).default('cover'),
  radius: z.enum(IMAGE_RADII).default('lg'),
  caption: z.string().max(CAPTION_MAX_LENGTH).default(''),
  /** Above the fold an image should be requested with the document; below it, never. */
  priority: z.boolean().default(false),
  hidden: visibility,
})

export type ImageProps = z.infer<typeof imageSchema>

export const imageNeedsAlt = (props: { readonly src: string; readonly alt: string }): boolean =>
  props.src !== '' && props.alt === ''
