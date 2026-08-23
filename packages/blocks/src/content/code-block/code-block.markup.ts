import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import {
  CODE_BAR,
  CODE_COPY,
  CODE_FILENAME,
  codeBlockStyles,
  codeScrollStyles,
} from './code-block.styles'
import type { CodeBlockProps } from './code-block.types'
import { codeLineMarkup } from './code-line.markup'
import { parseHighlightLines } from './highlight'

/**
 * The copy button in its resting state. What it does when pressed is state, and state is the
 * component's; what it looks like before anybody presses it is markup.
 */
const copyButtonMarkup = () =>
  el('button', {
    classNames: [CODE_COPY],
    attributes: { type: literal('button') },
    children: [
      txt('Copy'),
      el('span', {
        classNames: ['sr-only'],
        attributes: { 'aria-live': literal('polite') },
      }),
    ],
  })

export const codeBlockMarkup = defineMarkup<CodeBlockProps>(
  ({
    props: {
      code,
      language,
      filename,
      showLineNumbers,
      highlightLines,
      showCopyButton,
      wrap,
      hidden,
    },
  }) => {
    const highlighted = new Set(parseHighlightLines(highlightLines))
    const lines = code.split('\n')

    return el('div', {
      classNames: [codeBlockStyles({ hidden })],
      children: children(
        (filename !== '' || showCopyButton) &&
          el('div', {
            classNames: [CODE_BAR],
            children: children(
              el('span', { classNames: [CODE_FILENAME], children: [txt(filename)] }),
              showCopyButton && copyButtonMarkup(),
            ),
          }),
        el('pre', {
          classNames: [codeScrollStyles({ wrap })],
          attributes: {
            'aria-label': literal(
              filename === '' ? `Code sample, ${language}` : `Code sample, ${filename}`,
            ),
            role: literal('region'),
            tabIndex: literal(0),
          },
          children: [
            el('code', {
              children: lines.map((line, index) =>
                codeLineMarkup({
                  highlighted: highlighted.has(index + 1),
                  language,
                  number: index + 1,
                  showNumber: showLineNumbers,
                  text: line,
                }),
              ),
            }),
          ],
        }),
      ),
    })
  },
)
