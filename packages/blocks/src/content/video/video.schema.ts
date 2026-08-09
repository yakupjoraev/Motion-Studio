import { z } from 'zod'

import { visibility } from '../../scales'

export const VIDEO_ASPECTS = ['video', 'square', 'portrait', 'wide'] as const

export type VideoAspect = (typeof VIDEO_ASPECTS)[number]

export const VIDEO_RADII = ['none', 'sm', 'md', 'lg', 'xl'] as const

export type VideoRadius = (typeof VIDEO_RADII)[number]

export const VIDEO_URL_MAX_LENGTH = 2048

/**
 * A file, not an embed — deliberately. An `<iframe>` to a third-party player is a script the document
 * does not control and cannot sanitise, which FILE_FORMAT.md § Security has no row for because the
 * answer is "no". A `src` this block plays is a media file the browser decodes.
 */
export const videoSchema = z.object({
  src: z.string().max(VIDEO_URL_MAX_LENGTH).default(''),
  poster: z.string().max(VIDEO_URL_MAX_LENGTH).default(''),
  captions: z.string().max(VIDEO_URL_MAX_LENGTH).default(''),
  /** The footage says nothing the page does not. Anything else needs a captions track. */
  decorative: z.boolean().default(false),
  controls: z.boolean().default(true),
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),
  muted: z.boolean().default(true),
  aspect: z.enum(VIDEO_ASPECTS).default('video'),
  radius: z.enum(VIDEO_RADII).default('lg'),
  caption: z.string().max(300).default(''),
  hidden: visibility,
})

export type VideoProps = z.infer<typeof videoSchema>

/** What the export report reads — the same rule `hero-video` applies, in the same words. */
export const videoNeedsCaptions = (props: {
  readonly src: string
  readonly captions: string
  readonly decorative: boolean
}): boolean => props.src !== '' && props.captions === '' && !props.decorative

/**
 * Autoplay without muted is a page that makes noise at somebody. The browser blocks it anyway; this
 * makes the document say the same thing rather than storing a combination that silently never happens.
 */
export const effectiveMuted = (props: {
  readonly autoplay: boolean
  readonly muted: boolean
}): boolean => props.autoplay || props.muted
