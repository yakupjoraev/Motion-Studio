import { lazy } from 'react'

import { Badge } from './badge/badge'
import { Heading } from './heading/heading'
import { Image } from './image/image'
import { Quote } from './quote/quote'
import { RichText } from './rich-text/rich-text'
import { Stat } from './stat/stat'
import { Text } from './text/text'

/**
 * Two blocks are loaded on demand, and the reason is a number rather than a preference: with all nine
 * content blocks static the studio's first-load JS measured **250 kB against a 250 kB budget**
 * (ENGINEERING_CONTRACT.md § 6) — at the ceiling, with nothing left for the prompts that follow.
 *
 * These two are the right pair to move. `code-block` is the only content block that ships an algorithm
 * rather than markup (the tokeniser in `highlight.ts`), and `video` is the only other one that ships
 * behaviour — both declare a cost class above `cheap`, and neither is what a user drops first.
 * `NodeRenderer` already wraps every node in its own `Suspense` with a fixed-size skeleton, so the
 * swap costs no layout shift.
 */
const CodeBlock = lazy(async () => {
  const module = await import('./code-block/code-block')

  return { default: module.CodeBlock }
})

const Video = lazy(async () => {
  const module = await import('./video/video')

  return { default: module.Video }
})

export const components = {
  heading: Heading,
  text: Text,
  'rich-text': RichText,
  image: Image,
  video: Video,
  'code-block': CodeBlock,
  quote: Quote,
  stat: Stat,
  badge: Badge,
} as const
