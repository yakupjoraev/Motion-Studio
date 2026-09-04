import type { CodegenIR, IRChild, IRElement, IRElementMotion, IRRule } from '../../ir/ir.types'
import { type IRWarning, warning } from '../../warnings'

import type { ScriptFeature } from './print-scripts'

/**
 * Motion-engine presets, translated into what a file with no build step can actually run — prompt 44's
 * approximation table, and ADR-239 for where the preset id comes from.
 *
 * Every row either translates faithfully, approximates and says what it lost, or omits and says why.
 * There is no fourth outcome: a silent downgrade is the failure this file exists to prevent, and it is
 * why the table carries a sentence rather than a boolean.
 *
 * CSS-engine presets are absent from the table on purpose. Their fragments already produced classes and
 * keyframes, `buildIR` already put both in `ir.stylesheet`, and re-stating them here would give the
 * HTML target its own opinion about an animation the other three targets share.
 */
export const REVEAL_CLASS = 'ms-reveal'

export const VISIBLE_CLASS = 'is-visible'

interface Approximation {
  /** Added to the element's class list. */
  readonly classNames?: readonly string[]
  readonly feature?: ScriptFeature
  /** Absent means faithful; present is the sentence the export report carries. */
  readonly note?: string
}

const OMITTED_WEBGL = 'omitted: requires WebGL'

const OMITTED_TIMELINE = 'omitted: requires a scroll timeline'

const SPRING_NOTE = 'approximated: spring physics → bezier'

const reveal = (modifier?: string, note?: string): Approximation => ({
  classNames: modifier === undefined ? [REVEAL_CLASS] : [REVEAL_CLASS, modifier],
  feature: 'reveal',
  ...(note === undefined ? {} : { note }),
})

/**
 * Keyed by preset id. `fade-up` is the fixture catalogue's name for the entrance the real one spells
 * `fade` with a direction, and both are listed rather than aliased: a table that resolves names is a
 * table whose rows cannot be read off the page.
 */
const TABLE: Readonly<Record<string, Approximation>> = {
  fade: reveal(),
  'fade-up': reveal(),
  'fade-directional': reveal(),
  'blur-in': reveal('ms-reveal-blur'),
  'scale-in': reveal('ms-spring', SPRING_NOTE),
  'flip-in': reveal('ms-spring', SPRING_NOTE),
  'clip-reveal': reveal('ms-reveal-clip'),
  'mask-reveal': reveal('ms-reveal-clip'),
  'text-reveal': reveal(undefined, 'approximated: the whole line reveals, not word by word'),
  'stagger-children': reveal(undefined, 'approximated: children reveal together, not in sequence'),
  counter: { note: 'omitted: counting up needs a per-frame script' },
  'draw-line': { note: 'omitted: stroke-dashoffset needs a per-frame script' },
  typewriter: { note: 'omitted: typing needs a per-character script' },
  'icon-swap': reveal(),
  liquid: { classNames: ['ms-magnetic', 'ms-spring'], note: SPRING_NOTE },
  magnetic: { classNames: ['ms-magnetic'], note: 'approximated: no cursor tracking' },
  'scale-hover': { classNames: ['ms-magnetic', 'ms-spring'], note: SPRING_NOTE },
  'text-scramble': { note: 'omitted: scrambling needs a per-character script' },
  'cursor-follow': { classNames: ['ms-pointer'], feature: 'pointer' },
  'cursor-glow': { classNames: ['ms-pointer'], feature: 'pointer' },
  'gradient-follow': { classNames: ['ms-pointer'], feature: 'pointer' },
  spotlight: { classNames: ['ms-pointer'], feature: 'pointer' },
  'sticky-stack': {
    classNames: ['ms-sticky'],
    feature: 'sticky',
    note: 'approximated: no scale interpolation',
  },
  'scroll-timeline': { note: OMITTED_TIMELINE },
  'horizontal-scroll': { note: OMITTED_TIMELINE },
  particles: { note: OMITTED_WEBGL },
}

/** What a preset the table does not name degrades to, decided by the engine that would have run it. */
function fallback(entry: IRElementMotion): Approximation {
  switch (entry.engine) {
    case 'css':
      return {}
    case 'motion':
      return reveal(undefined, 'approximated: the Motion transition becomes a CSS transition')
  }
}

export interface MotionApproximation {
  /** Element → the classes the approximation adds to it, by identity: the IR is readonly. */
  readonly classNames: ReadonlyMap<IRElement, readonly string[]>
  readonly features: ReadonlySet<ScriptFeature>
  readonly warnings: readonly IRWarning[]
}

const walk = (element: IRElement, visit: (element: IRElement) => void): void => {
  visit(element)

  for (const child of element.children) {
    if ((child as IRChild).kind === 'element') {
      walk(child as IRElement, visit)
    }
  }
}

export function approximateMotion(ir: CodegenIR): MotionApproximation {
  const classNames = new Map<IRElement, readonly string[]>()
  const features = new Set<ScriptFeature>()
  const seen = new Set<string>()
  const warnings: IRWarning[] = []

  for (const component of ir.components) {
    walk(component.root, (element) => {
      const added: string[] = []

      for (const entry of element.motion ?? []) {
        const row = TABLE[entry.presetId] ?? fallback(entry)

        added.push(...(row.classNames ?? []))

        if (row.feature !== undefined) {
          features.add(row.feature)
        }

        if (row.note === undefined || seen.has(`${entry.presetId}:${row.note}`)) {
          continue
        }

        seen.add(`${entry.presetId}:${row.note}`)
        warnings.push(
          warning(
            row.note.startsWith('omitted') ? 'unsupported' : 'approximation',
            `HTML export, '${entry.presetId}' on the ${entry.channel} channel — ${row.note}.`,
          ),
        )
      }

      if (added.length > 0) {
        classNames.set(element, [...new Set(added)])
      }
    })
  }

  return { classNames, features, warnings }
}

/**
 * The rules the approximation classes need. Emitted only for the classes actually used, the same rule
 * the utility sheet follows, so a document with no entrances carries no entrance CSS.
 *
 * The reduced-motion block is not a nicety here — it is load-bearing. `.ms-reveal` starts at zero
 * opacity and the observer is what clears it, so a reader who has asked for no motion, and a reader
 * with no JavaScript at all, would otherwise get a blank page. `print-html.ts` carries the `<noscript>`
 * half of the same guarantee.
 */
export function approximationRules(used: ReadonlySet<string>): readonly IRRule[] {
  const rules: IRRule[] = []
  const has = (className: string): boolean => used.has(className)

  if (has(REVEAL_CLASS)) {
    rules.push(
      {
        selector: `.${REVEAL_CLASS}`,
        declarations: [
          'opacity: 0',
          'transform: translateY(1rem)',
          'transition: opacity var(--ms-duration-slow) var(--ms-ease-decelerate), transform var(--ms-duration-slow) var(--ms-ease-decelerate), filter var(--ms-duration-slow) var(--ms-ease-decelerate), clip-path var(--ms-duration-slow) var(--ms-ease-decelerate)',
        ],
      },
      {
        selector: `.${REVEAL_CLASS}.${VISIBLE_CLASS}`,
        declarations: ['opacity: 1', 'transform: none', 'filter: none', 'clip-path: none'],
      },
    )
  }

  if (has('ms-reveal-blur')) {
    rules.push({ selector: '.ms-reveal-blur', declarations: ['filter: blur(8px)'] })
  }

  if (has('ms-reveal-clip')) {
    rules.push({
      selector: '.ms-reveal-clip',
      declarations: ['clip-path: inset(0 0 100% 0)', 'transform: none'],
    })
  }

  if (has('ms-spring')) {
    rules.push({
      selector: '.ms-spring',
      declarations: ['transition-timing-function: var(--ms-ease-spring)'],
    })
  }

  if (has('ms-magnetic')) {
    rules.push(
      {
        selector: '.ms-magnetic',
        declarations: [
          'transition: transform var(--ms-duration-base) var(--ms-ease-standard)',
          'will-change: transform',
        ],
      },
      {
        selector: '.ms-magnetic:hover',
        declarations: ['transform: translate3d(0, -2px, 0) scale(1.02)'],
      },
    )
  }

  if (has('ms-sticky')) {
    rules.push({ selector: '.ms-sticky', declarations: ['position: sticky', 'top: 0'] })
  }

  if (rules.length === 0) {
    return rules
  }

  return [
    ...rules,
    {
      selector: `.${REVEAL_CLASS}, .ms-magnetic`,
      declarations: ['opacity: 1', 'transform: none', 'filter: none', 'clip-path: none'],
      media: '(prefers-reduced-motion: reduce)',
    },
    {
      selector: `.${REVEAL_CLASS}, .ms-magnetic, .ms-spring`,
      declarations: ['transition: none'],
      media: '(prefers-reduced-motion: reduce)',
    },
  ]
}
