import { CODE_BAR, CODE_FILENAME, codeBlockStyles } from './code-block.styles'
import type { CodeBlockProps } from './code-block.types'
import { CodeLine } from './code-line'
import { CodeScroller } from './code-scroller'
import { CopyButton } from './copy-button'
import { parseHighlightLines } from './highlight'

/**
 * A code sample: window bar, optional line numbers, highlighted lines, and a copy button.
 *
 * Highlighting is a small tokeniser rather than `shiki` (ADR-124), and the whole block is loaded on
 * demand — `content/components.ts` wraps it in `lazy`, so neither the tokeniser nor this component is
 * in the studio's first-load bundle.
 */
export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers,
  highlightLines,
  showCopyButton,
  wrap,
  hidden,
}: CodeBlockProps) {
  const highlighted = new Set(parseHighlightLines(highlightLines))
  const lines = code.split('\n')

  return (
    <div className={codeBlockStyles({ hidden })}>
      {(filename !== '' || showCopyButton) && (
        <div className={CODE_BAR}>
          <span className={CODE_FILENAME}>{filename}</span>
          {showCopyButton && <CopyButton value={code} />}
        </div>
      )}

      <CodeScroller
        label={filename === '' ? `Code sample, ${language}` : `Code sample, ${filename}`}
        wrap={wrap}
      >
        {lines.map((line, index) => (
          <CodeLine
            highlighted={highlighted.has(index + 1)}
            key={`${index + 1}-${line}`}
            language={language}
            number={index + 1}
            showNumber={showLineNumbers}
            text={line}
          />
        ))}
      </CodeScroller>
    </div>
  )
}
