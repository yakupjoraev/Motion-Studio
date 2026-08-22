import {
  BREAKPOINTS,
  type BreakpointId,
  CASCADE_ORDER,
  isBreakpointId,
} from '@motion-studio/schema'

import type { IRRule, IRStylesheet } from '../../ir/ir.types'
import { sortClasses, splitVariant } from '../../ir/tailwind/class-order'
import { type IRWarning, warning } from '../../warnings'
import { printStylesheet } from '../print-stylesheet'

import { declarationsFor } from './utility-rules'

/**
 * The `<style>` block — reset, fonts, theme variables, the rules the document's own classes need, and
 * the keyframes the presets wrote, in that order because CSS is order-dependent and a reader should be
 * able to say why each section is where it is.
 *
 * Only the classes the markup actually printed become rules — prompt 44's assertion, and the reason the
 * HTML target does not ship Tailwind's CDN build: 3 MB and a network request in a file whose whole
 * promise is that it opens from the filesystem.
 */
const RESET = `*,
*::before,
*::after {
  box-sizing: border-box;
  border: 0 solid;
}

* {
  margin: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
}

body {
  min-height: 100vh;
  font-family: var(--ms-font-sans);
  color: var(--ms-color-foreground);
  background-color: var(--ms-color-surface-0);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img,
svg,
video,
canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
  background: none;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: inherit;
}

:focus-visible {
  outline: 2px solid var(--ms-color-accent);
  outline-offset: 2px;
}`

/**
 * ADR-241. The stack is the theme's own; the `@font-face` is commented out because the repository holds
 * no font files to encode and a rule with no reachable `src` is a rule that lies about self-hosting.
 */
const FONT_NOTE = (assets: string): string => `/*
 * Fonts: system stack, mode '${assets}'. The theme's families are declared in the variables above.
 * To self-host, drop a woff2 beside this file and uncomment the block below.
 *
 * @font-face {
 *   font-family: 'Your Family';
 *   src: url('./your-family.woff2') format('woff2');
 *   font-weight: 400 700;
 *   font-display: swap;
 * }
 */`

/** CSS identifiers cannot carry `:`, brackets or commas raw — `sm\\:grid-cols-2` is one class name. */
const escapeClass = (className: string): string =>
  className.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`)

/** `hover:`, `focus-visible:` and friends become a pseudo-class; anything else is not translated. */
const PSEUDO = new Set([
  'hover',
  'focus',
  'focus-visible',
  'focus-within',
  'active',
  'visited',
  'disabled',
  'first',
  'last',
  'odd',
  'even',
])

const PSEUDO_NAMES: Readonly<Record<string, string>> = {
  first: 'first-child',
  last: 'last-child',
  odd: 'nth-child(odd)',
  even: 'nth-child(even)',
}

interface Translated {
  readonly rule: IRRule
  readonly breakpoint: BreakpointId
}

function translate(className: string): Translated | undefined {
  const { variant, utility } = splitVariant(className)
  const declarations = declarationsFor(utility)

  if (declarations === undefined) {
    return undefined
  }

  const selector = `.${escapeClass(className)}`

  if (variant === '') {
    return { rule: { selector, declarations }, breakpoint: 'base' }
  }

  if (isBreakpointId(variant)) {
    return {
      rule: { selector, declarations, media: `(min-width: ${BREAKPOINTS[variant].min}px)` },
      breakpoint: variant,
    }
  }

  if (PSEUDO.has(variant)) {
    return {
      rule: { selector: `${selector}:${PSEUDO_NAMES[variant] ?? variant}`, declarations },
      breakpoint: 'base',
    }
  }

  return undefined
}

export interface UtilitySheet {
  readonly rules: readonly IRRule[]
  readonly warnings: readonly IRWarning[]
  /** How many rules the used classes produced, which is what the prompt asks to be asserted. */
  readonly count: number
}

/**
 * `usedClasses` → rules, ordered the way Tailwind orders them: base first, then each breakpoint
 * ascending, and within a breakpoint the core-plugin sequence `sortClasses` already knows. A generated
 * sheet in a different order would resolve conflicts differently from the React export of the same
 * document, which is the one thing the two targets must not do.
 *
 * `covered` names the selectors the IR stylesheet already carries — a CSS-engine preset's class, and
 * the approximation classes. They are not utilities and must not be reported as unknown ones.
 */
export function utilitySheet(
  usedClasses: ReadonlySet<string>,
  covered: ReadonlySet<string>,
): UtilitySheet {
  const ordered = sortClasses([...usedClasses])
  const byBreakpoint = new Map<BreakpointId, IRRule[]>()
  const unknown: string[] = []

  for (const className of ordered) {
    if (covered.has(className)) {
      continue
    }

    const translated = translate(className)

    if (translated === undefined) {
      unknown.push(className)

      continue
    }

    byBreakpoint.set(translated.breakpoint, [
      ...(byBreakpoint.get(translated.breakpoint) ?? []),
      translated.rule,
    ])
  }

  const rules = CASCADE_ORDER.flatMap((id) => byBreakpoint.get(id) ?? [])

  return {
    rules,
    count: rules.length,
    warnings:
      unknown.length === 0
        ? []
        : [
            warning(
              'unsupported',
              `HTML export has no rule for ${unknown.join(', ')}; ${
                unknown.length === 1 ? 'that class' : 'those classes'
              } paint nothing.`,
            ),
          ],
  }
}

export interface CssInput {
  readonly themeCss?: string | undefined
  readonly assets: string
  readonly utilities: readonly IRRule[]
  readonly approximations: readonly IRRule[]
  readonly stylesheet: IRStylesheet
}

export function printCss(input: CssInput): string {
  const generated: IRStylesheet = {
    rules: [...input.utilities, ...input.approximations, ...input.stylesheet.rules],
    keyframes: input.stylesheet.keyframes,
  }

  return [
    RESET,
    ...(input.themeCss === undefined ? [] : [input.themeCss.trim()]),
    FONT_NOTE(input.assets),
    printStylesheet(generated),
  ]
    .filter((section) => section !== '')
    .join('\n\n')
}
