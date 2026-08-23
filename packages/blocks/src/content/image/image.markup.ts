import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import {
  IMAGE_CAPTION,
  IMAGE_EMPTY,
  imageFigureStyles,
  imageFrameStyles,
  imageStyles,
} from './image.styles'
import type { ImageProps } from './image.types'

export const imageMarkup = defineMarkup<ImageProps>(
  ({ props: { src, alt, width, height, sizes, aspect, fit, radius, caption, priority, hidden } }) =>
    el('figure', {
      classNames: [imageFigureStyles({ hidden })],
      children: children(
        el('div', {
          classNames: [imageFrameStyles({ aspect, radius })],
          children: [
            src === ''
              ? el('span', { classNames: [IMAGE_EMPTY], children: [txt('No image yet')] })
              : el('img', {
                  classNames: [imageStyles({ fit, aspect })],
                  attributes: {
                    alt: literal(alt),
                    decoding: literal('async'),
                    fetchPriority: literal(priority ? 'high' : 'auto'),
                    height: literal(height),
                    loading: literal(priority ? 'eager' : 'lazy'),
                    sizes: literal(sizes),
                    src: literal(src),
                    width: literal(width),
                  },
                }),
          ],
        }),
        caption !== '' &&
          el('figcaption', { classNames: [IMAGE_CAPTION], children: [txt(caption)] }),
      ),
    }),
)
