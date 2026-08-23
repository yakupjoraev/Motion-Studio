import { type MarkupElement, el, literal } from '@motion-studio/schema'

import type { HeroImage } from './hero-app-preview.schema'
import {
  HERO_PREVIEW_FRAME,
  HERO_PREVIEW_IMAGE,
  HERO_PREVIEW_TILT,
  PLACEHOLDER_BAR,
  PLACEHOLDER_BODY,
  PLACEHOLDER_CANVAS,
  PLACEHOLDER_DOT,
  PLACEHOLDER_NODE,
  PLACEHOLDER_ROW,
  PLACEHOLDER_SIDEBAR,
  SIDEBAR_ROWS,
} from './hero-app-preview.styles'

export interface PreviewPlateMarkupInput {
  readonly image: HeroImage
  readonly width: number
  readonly height: number
  readonly tiltX: number
  readonly tiltY: number
  readonly perspective: number
}

/** `PreviewWindow` as markup: the block's default state, and furniture all the way down. */
const previewWindowMarkup = (): MarkupElement =>
  el('div', {
    attributes: { 'aria-hidden': literal('true') },
    children: [
      el('div', {
        classNames: [PLACEHOLDER_BAR],
        children: [
          el('span', { classNames: [PLACEHOLDER_DOT] }),
          el('span', { classNames: [PLACEHOLDER_DOT] }),
          el('span', { classNames: [PLACEHOLDER_DOT] }),
        ],
      }),
      el('div', {
        classNames: [PLACEHOLDER_BODY],
        children: [
          el('div', {
            classNames: [PLACEHOLDER_SIDEBAR],
            children: SIDEBAR_ROWS.map((width) =>
              el('span', { classNames: [PLACEHOLDER_ROW, width] }),
            ),
          }),
          el('div', {
            classNames: [PLACEHOLDER_CANVAS],
            children: [el('span', { classNames: [PLACEHOLDER_NODE] })],
          }),
        ],
      }),
    ],
  })

export const previewPlateMarkup = ({
  image,
  width,
  height,
  tiltX,
  tiltY,
  perspective,
}: PreviewPlateMarkupInput): MarkupElement =>
  el('div', {
    classNames: [HERO_PREVIEW_TILT],
    cssVars: {
      '--ms-tilt-x': `${tiltX}deg`,
      '--ms-tilt-y': `${tiltY}deg`,
      '--ms-tilt-perspective': `${perspective}px`,
    },
    children: [
      el('div', {
        classNames: [HERO_PREVIEW_FRAME],
        children: [
          image.src === ''
            ? previewWindowMarkup()
            : el('img', {
                classNames: [HERO_PREVIEW_IMAGE],
                attributes: {
                  alt: literal(image.alt),
                  decoding: literal('async'),
                  fetchPriority: literal('high'),
                  height: literal(height),
                  loading: literal('eager'),
                  sizes: literal('(max-width: 1024px) 100vw, 50vw'),
                  src: literal(image.src),
                  width: literal(width),
                },
              }),
        ],
      }),
    ],
  })
