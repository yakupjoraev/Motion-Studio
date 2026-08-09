import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import {
  HERO_TERMINAL_BAR,
  HERO_TERMINAL_BODY,
  HERO_TERMINAL_CARET,
  HERO_TERMINAL_TITLE,
  HERO_TERMINAL_WINDOW,
  LINE_SIGILS,
  TRAFFIC_LIGHTS,
  TRAFFIC_LIGHT_BASE,
  heroTerminalSurfaceStyles,
  terminalLineStyles,
} from './hero-terminal.styles'
import type { HeroTerminalProps } from './hero-terminal.types'

/**
 * Text on the left, a terminal window on the right.
 *
 * **The LCP element is the headline.** The window is text on a surface — no image decodes, nothing
 * is fetched, and the largest glyphs on the page are still the `<h1>`'s.
 *
 * The typing is a motion preset reference, not a hand-written animation: `defaultMotion` declares the
 * `typewriter` preset on the `continuous` channel and `packages/motion` will resolve it. Which means
 * the transcript below is the *finished* state — every line is real DOM text right now, so the block
 * is completely readable with the animation disabled, off-screen, or never implemented at all. A
 * terminal that only says something once an animation has run is a terminal that says nothing to a
 * screen reader.
 *
 * Design reference: impeccable.style — the developer-tool hero. The technique is the window
 * hierarchy: inset surface, raised title bar, one hairline. Two surfaces and a border, no gradient.
 */
export function HeroTerminal({
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
}: HeroTerminalProps) {
  return (
    <section
      className={`${heroSectionStyles({ padding, minHeight, align: 'start', hidden })} ${heroTerminalSurfaceStyles({ background })} justify-center`}
    >
      <div className={heroInnerStyles({ maxWidth, align: 'start' })}>
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <HeroCopy
              actions={actions}
              align={align}
              eyebrow={eyebrow}
              eyebrowStyle={eyebrowStyle}
              headline={headline}
              subtitle={subtitle}
              headlineSize="display-2"
              subtitleSize="md"
            />
          </div>

          <div className={HERO_TERMINAL_WINDOW} data-testid="hero-terminal-window">
            {chrome !== 'title' && (
              <div className={HERO_TERMINAL_BAR}>
                <span aria-hidden="true" className="flex items-center gap-2">
                  {TRAFFIC_LIGHTS.map((light) => (
                    <span className={`${TRAFFIC_LIGHT_BASE} ${light}`} key={light} />
                  ))}
                </span>
                {chrome === 'both' && <span className={HERO_TERMINAL_TITLE}>{title}</span>}
              </div>
            )}

            {chrome === 'title' && (
              <div className={HERO_TERMINAL_BAR}>
                <span className={HERO_TERMINAL_TITLE}>{title}</span>
              </div>
            )}

            <pre className={HERO_TERMINAL_BODY} data-testid="hero-terminal-body">
              <code>
                {lines.map((line, index) => (
                  <span
                    className={terminalLineStyles({ kind: line.kind })}
                    key={`${index}-${line.text}`}
                  >
                    {`${LINE_SIGILS[line.kind]}${line.text}`}
                  </span>
                ))}
              </code>
              {caret && (
                <span
                  aria-hidden="true"
                  className={HERO_TERMINAL_CARET}
                  data-testid="terminal-caret"
                />
              )}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
