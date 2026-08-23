import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'

import type { TerminalLine, WindowChrome } from './hero-terminal.schema'
import {
  HERO_TERMINAL_BAR,
  HERO_TERMINAL_BODY,
  HERO_TERMINAL_CARET,
  HERO_TERMINAL_TITLE,
  HERO_TERMINAL_WINDOW,
  LINE_SIGILS,
  TRAFFIC_LIGHTS,
  TRAFFIC_LIGHT_BASE,
  terminalLineStyles,
} from './hero-terminal.styles'

export interface TerminalWindowMarkupInput {
  readonly title: string
  readonly chrome: WindowChrome
  readonly caret: boolean
  readonly lines: readonly TerminalLine[]
}

/** The title bar. The lights are furniture, so the whole span is hidden. */
const terminalBarMarkup = (title: string, chrome: WindowChrome): MarkupElement =>
  el('div', {
    classNames: [HERO_TERMINAL_BAR],
    children: children(
      chrome !== 'title' &&
        el('span', {
          classNames: ['flex items-center gap-2'],
          attributes: { 'aria-hidden': literal('true') },
          children: TRAFFIC_LIGHTS.map((light) =>
            el('span', { classNames: [TRAFFIC_LIGHT_BASE, light] }),
          ),
        }),
      chrome !== 'lights' &&
        el('span', { classNames: [HERO_TERMINAL_TITLE], children: [txt(title)] }),
    ),
  })

/** The transcript, as real text: the sigil comes from the line's kind rather than from its text. */
const terminalTranscriptMarkup = (lines: readonly TerminalLine[]): MarkupElement =>
  el('code', {
    children: lines.map((line) =>
      el('span', {
        classNames: [terminalLineStyles({ kind: line.kind })],
        children: [txt(`${LINE_SIGILS[line.kind]}${line.text}`)],
      }),
    ),
  })

export const terminalWindowMarkup = ({
  title,
  chrome,
  caret,
  lines,
}: TerminalWindowMarkupInput): MarkupElement =>
  el('div', {
    classNames: [HERO_TERMINAL_WINDOW],
    children: [
      terminalBarMarkup(title, chrome),
      el('pre', {
        classNames: [HERO_TERMINAL_BODY],
        children: children(
          terminalTranscriptMarkup(lines),
          caret &&
            el('span', {
              classNames: [HERO_TERMINAL_CARET],
              attributes: { 'aria-hidden': literal('true') },
            }),
        ),
      }),
    ],
  })
