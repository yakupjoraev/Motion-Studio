import { type MarkupElement, children, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import type { Language } from './code-block.languages'
import {
  CODE_LINE,
  CODE_LINE_HIGHLIGHTED,
  CODE_LINE_NUMBER,
  TOKEN_CLASS,
} from './code-block.styles'
import { tokenize } from './highlight'

export interface CodeLineMarkupInput {
  readonly text: string
  readonly number: number
  readonly language: Language
  readonly showNumber: boolean
  readonly highlighted: boolean
}

/** One line, painted by the same tokeniser the canvas runs. */
export function codeLineMarkup({
  text,
  number,
  language,
  showNumber,
  highlighted,
}: CodeLineMarkupInput): MarkupElement {
  return el('span', {
    classNames: [cn(CODE_LINE, highlighted && CODE_LINE_HIGHLIGHTED)],
    ...(highlighted ? { attributes: { 'data-highlighted': literal('true') } } : {}),
    children: children(
      showNumber &&
        el('span', {
          classNames: [CODE_LINE_NUMBER],
          attributes: { 'aria-hidden': literal(true) },
          children: [txt(String(number))],
        }),
      el('span', {
        ...(showNumber ? {} : { classNames: ['col-span-2'] }),
        children: children(
          ...tokenize(text, language).map((token) =>
            el('span', { classNames: [TOKEN_CLASS[token.kind]], children: [txt(token.text)] }),
          ),
          // An empty line still has to occupy one, so it carries a newline of its own.
          text === '' && txt('\n'),
        ),
      }),
    ),
  })
}
