import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { effectiveMuted } from './video.schema'
import {
  VIDEO_CAPTION,
  VIDEO_ELEMENT,
  VIDEO_EMPTY,
  videoFigureStyles,
  videoFrameStyles,
} from './video.styles'
import type { VideoProps } from './video.types'

/**
 * The markup only. Autoplay is an effect the component runs once the element exists — `HTML` gets it
 * through the target's own script and `React` through the emitted component, and neither is markup.
 */
export const videoMarkup = defineMarkup<VideoProps>(
  ({
    props: {
      src,
      poster,
      captions,
      decorative,
      controls,
      autoplay,
      loop,
      muted,
      aspect,
      radius,
      caption,
      hidden,
    },
  }) =>
    el('figure', {
      classNames: [videoFigureStyles({ hidden })],
      children: children(
        el('div', {
          classNames: [videoFrameStyles({ aspect, radius })],
          children: [
            src === ''
              ? el('span', { classNames: [VIDEO_EMPTY], children: [txt('No video yet')] })
              : el('video', {
                  classNames: [VIDEO_ELEMENT],
                  attributes: {
                    ...(decorative && !controls ? { 'aria-hidden': literal('true') } : {}),
                    controls: literal(controls),
                    loop: literal(loop),
                    muted: literal(effectiveMuted({ autoplay, muted })),
                    playsInline: literal(true),
                    ...(poster === '' ? {} : { poster: literal(poster) }),
                    preload: literal('metadata'),
                    src: literal(src),
                  },
                  children: children(
                    captions !== '' &&
                      el('track', {
                        attributes: {
                          default: literal(true),
                          kind: literal('captions'),
                          label: literal('Captions'),
                          src: literal(captions),
                          srcLang: literal('en'),
                        },
                      }),
                  ),
                }),
          ],
        }),
        caption !== '' &&
          el('figcaption', { classNames: [VIDEO_CAPTION], children: [txt(caption)] }),
      ),
    }),
)
