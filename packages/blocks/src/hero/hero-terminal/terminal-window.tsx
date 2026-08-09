import type { TerminalLine, WindowChrome } from './hero-terminal.schema'
import {
  HERO_TERMINAL_BODY,
  HERO_TERMINAL_CARET,
  HERO_TERMINAL_WINDOW,
} from './hero-terminal.styles'
import { TerminalBar } from './terminal-bar'
import { TerminalTranscript } from './terminal-transcript'

export interface TerminalWindowProps {
  readonly title: string
  readonly chrome: WindowChrome
  readonly caret: boolean
  readonly lines: readonly TerminalLine[]
}

/** The window: a title bar and a transcript, in an inset surface with one hairline between them. */
export function TerminalWindow({ title, chrome, caret, lines }: TerminalWindowProps) {
  return (
    <div className={HERO_TERMINAL_WINDOW} data-testid="hero-terminal-window">
      <TerminalBar chrome={chrome} title={title} />

      <pre className={HERO_TERMINAL_BODY} data-testid="hero-terminal-body">
        <TerminalTranscript lines={lines} />
        {caret && (
          <span aria-hidden="true" className={HERO_TERMINAL_CARET} data-testid="terminal-caret" />
        )}
      </pre>
    </div>
  )
}
