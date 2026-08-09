import { HeroCopy } from '../hero-copy'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { heroTerminalSurfaceStyles } from './hero-terminal.styles'
import type { HeroTerminalProps } from './hero-terminal.types'
import { TerminalWindow } from './terminal-window'

/**
 * Text on the left, a terminal window on the right.
 *
 * **The LCP element is the headline.** The window is text on a surface — no image decodes, nothing is
 * fetched, and the largest glyphs on the page are still the `<h1>`'s.
 *
 * The typing is a motion preset reference, not a hand-written animation: `defaultMotion` declares the
 * `typewriter` preset on the `continuous` channel and `packages/motion` will resolve it. The
 * transcript is therefore the *finished* state — a terminal that only says something once an
 * animation has run is a terminal that says nothing to a screen reader.
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
              headlineSize="display-2"
              subtitle={subtitle}
              subtitleSize="md"
            />
          </div>

          <TerminalWindow caret={caret} chrome={chrome} lines={lines} title={title} />
        </div>
      </div>
    </section>
  )
}
