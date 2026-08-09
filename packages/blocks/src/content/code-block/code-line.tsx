import type { Language } from './code-block.languages'
import {
  CODE_LINE,
  CODE_LINE_HIGHLIGHTED,
  CODE_LINE_NUMBER,
  TOKEN_CLASS,
} from './code-block.styles'
import { tokenize } from './highlight'

export interface CodeLineProps {
  readonly text: string
  readonly number: number
  readonly language: Language
  readonly showNumber: boolean
  readonly highlighted: boolean
}

/** One line: its number, and its text painted by the tokeniser. */
export function CodeLine({ text, number, language, showNumber, highlighted }: CodeLineProps) {
  return (
    <span
      className={`${CODE_LINE} ${highlighted ? CODE_LINE_HIGHLIGHTED : ''}`}
      data-highlighted={highlighted ? 'true' : undefined}
    >
      {showNumber && (
        <span aria-hidden="true" className={CODE_LINE_NUMBER}>
          {number}
        </span>
      )}
      <span className={showNumber ? '' : 'col-span-2'}>
        {tokenize(text, language).map((token, index) => (
          <span className={TOKEN_CLASS[token.kind]} key={`${number}-${index}-${token.text}`}>
            {token.text}
          </span>
        ))}
        {/* An empty line still has to occupy one, so it carries a newline of its own. */}
        {text === '' && '\n'}
      </span>
    </span>
  )
}
