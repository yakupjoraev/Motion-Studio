import { defineMarkup, el } from '@motion-studio/schema'

import { heroCopyMarkup } from '../hero-copy.markup'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { heroTerminalSurfaceStyles } from './hero-terminal.styles'
import type { HeroTerminalProps } from './hero-terminal.types'
import { terminalWindowMarkup } from './terminal-window.markup'

export const heroTerminalMarkup = defineMarkup<HeroTerminalProps>(
  ({
    props: {
      eyebrow,
      eyebrowStyle,
      headline,
      subtitle,
      actions,
      align,
      maxWidth,
      padding,
      minHeight,
      hidden,
      background,
      title,
      chrome,
      caret,
      lines,
    },
  }) =>
    el('section', {
      classNames: [
        heroSectionStyles({ padding, minHeight, align: 'start', hidden }),
        heroTerminalSurfaceStyles({ background }),
        'justify-center',
      ],
      children: [
        el('div', {
          classNames: [heroInnerStyles({ maxWidth, align: 'start' })],
          children: [
            el('div', {
              classNames: ['grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16'],
              children: [
                el('div', {
                  classNames: ['min-w-0'],
                  children: [
                    heroCopyMarkup({
                      actions,
                      align,
                      eyebrow,
                      eyebrowStyle,
                      headline,
                      headlineSize: 'display-2',
                      subtitle,
                      subtitleSize: 'md',
                    }),
                  ],
                }),
                terminalWindowMarkup({ caret, chrome, lines, title }),
              ],
            }),
          ],
        }),
      ],
    }),
)
