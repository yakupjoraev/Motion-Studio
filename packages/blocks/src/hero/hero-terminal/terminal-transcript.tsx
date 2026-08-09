import type { TerminalLine } from './hero-terminal.schema'
import { LINE_SIGILS, terminalLineStyles } from './hero-terminal.styles'

export interface TerminalTranscriptProps {
  readonly lines: readonly TerminalLine[]
}

/**
 * The transcript, as real text before any animation runs — which is what makes the block readable
 * with motion disabled and legible to a screen reader in one pass.
 *
 * The sigil comes from the line's *kind* rather than from its text, so what a user copies is the
 * command and not the prompt, and so an error line differs by more than its colour.
 */
export function TerminalTranscript({ lines }: TerminalTranscriptProps) {
  return (
    <code>
      {lines.map((line, position) => (
        <span className={terminalLineStyles({ kind: line.kind })} key={`${position}-${line.text}`}>
          {`${LINE_SIGILS[line.kind]}${line.text}`}
        </span>
      ))}
    </code>
  )
}
