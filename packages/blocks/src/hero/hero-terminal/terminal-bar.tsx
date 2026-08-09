import type { WindowChrome } from './hero-terminal.schema'
import {
  HERO_TERMINAL_BAR,
  HERO_TERMINAL_TITLE,
  TRAFFIC_LIGHTS,
  TRAFFIC_LIGHT_BASE,
} from './hero-terminal.styles'

export interface TerminalBarProps {
  readonly title: string
  readonly chrome: WindowChrome
}

/**
 * The title bar. The lights are furniture and `aria-hidden` — reading "circle circle circle" to
 * somebody is not a window — and they are themed rather than being macOS's three fixed colours.
 */
export function TerminalBar({ title, chrome }: TerminalBarProps) {
  return (
    <div className={HERO_TERMINAL_BAR}>
      {chrome !== 'title' && (
        <span aria-hidden="true" className="flex items-center gap-2">
          {TRAFFIC_LIGHTS.map((light) => (
            <span className={`${TRAFFIC_LIGHT_BASE} ${light}`} key={light} />
          ))}
        </span>
      )}
      {chrome !== 'lights' && <span className={HERO_TERMINAL_TITLE}>{title}</span>}
    </div>
  )
}
