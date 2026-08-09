import { badgeDefinition } from './badge/badge.definition'
import { codeBlockDefinition } from './code-block/code-block.definition'
import { headingDefinition } from './heading/heading.definition'
import { imageDefinition } from './image/image.definition'
import { quoteDefinition } from './quote/quote.definition'
import { richTextDefinition } from './rich-text/rich-text.definition'
import { statDefinition } from './stat/stat.definition'
import { textDefinition } from './text/text.definition'
import { videoDefinition } from './video/video.definition'

// COMPONENT_LIBRARY.md § Catalogue order, which is the order the palette groups them in.
export const definitions = {
  heading: headingDefinition,
  text: textDefinition,
  'rich-text': richTextDefinition,
  image: imageDefinition,
  video: videoDefinition,
  'code-block': codeBlockDefinition,
  quote: quoteDefinition,
  stat: statDefinition,
  badge: badgeDefinition,
} as const
