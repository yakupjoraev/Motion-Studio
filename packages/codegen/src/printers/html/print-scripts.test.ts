import { describe, expect, it } from 'vitest'

import { FIXTURE_COLOR_MODE_KEY } from '../../test/theme'

import { type ScriptFeature, printScripts } from './print-scripts'

/**
 * Prompt 44's rule about the guard, read as two assertions rather than as one sentence: animation goes
 * inside `if (!reduced.matches)`, function goes outside it. An accordion that stops opening because the
 * reader asked for less motion is a broken page.
 */
const features = (...list: readonly ScriptFeature[]): ReadonlySet<ScriptFeature> => new Set(list)

/** The body of `if (!reduced.matches) { … }`, or `''` when the script has no guarded block. */
function guarded(source: string): string {
  const start = source.indexOf('if (!reduced.matches) {')

  return start === -1 ? '' : source.slice(start)
}

describe('printScripts', () => {
  it('emits nothing for a document that needs nothing', () => {
    expect(printScripts({ features: features() })).toBeUndefined()
  })

  it('emits only the features the document asked for', () => {
    const source = printScripts({ features: features('reveal') }) ?? ''

    expect(source).toContain('IntersectionObserver')
    expect(source).not.toContain('data-ms-carousel')
    expect(source).not.toContain('pointermove')
  })

  it('keeps the accordion outside the reduced-motion guard', () => {
    const source = printScripts({ features: features('disclosure', 'pointer') }) ?? ''

    expect(source).toContain('data-ms-disclosure')
    expect(guarded(source)).not.toContain('data-ms-disclosure')
    expect(guarded(source)).toContain('pointermove')
  })

  it.each<ScriptFeature>(['disclosure', 'carousel', 'menu', 'color-mode'])(
    'keeps %s working under reduced motion',
    (feature) => {
      const source = printScripts({ features: features(feature) }) ?? ''

      expect(source).not.toContain('if (!reduced.matches) {')
    },
  )

  /** The observer is what clears the hidden state, so this branch is what a reduced-motion reader sees. */
  it('shows the revealed elements immediately under reduced motion', () => {
    const source = printScripts({ features: features('reveal') }) ?? ''

    expect(source).toContain('if (reduced.matches) {')
    expect(source).toContain("revealed.forEach((node) => node.classList.add('is-visible'))")
  })

  it('persists the colour mode through the key it was given', () => {
    const source =
      printScripts({
        features: features('color-mode'),
        colorModeStorageKey: FIXTURE_COLOR_MODE_KEY,
      }) ?? ''

    expect(source).toContain(`localStorage.setItem('${FIXTURE_COLOR_MODE_KEY}', mode)`)
    expect(source).toContain('aria-pressed')
  })

  it('flips the mode but stores nothing when it was given no key', () => {
    const source = printScripts({ features: features('color-mode') }) ?? ''

    expect(source).toContain('const store = () => {}')
    expect(source).not.toContain('localStorage')
  })

  it('maintains the ARIA state the disclosure and the menu own', () => {
    const source = printScripts({ features: features('disclosure', 'menu') }) ?? ''

    expect(source).toContain("setAttribute('aria-expanded'")
    expect(source).toContain("event.key === 'Escape'")
    expect(source).toContain("event.key !== 'Tab'")
  })

  /**
   * The ceiling, not the budget. Prompt 44's 3 kB is stated for "a typical landing page", which is what
   * `print-html.test.ts` measures on the full-landing fixture; this is every feature at once, which no
   * single document has yet produced. Measured at 4352 bytes, so the guard is 5 kB: past that, a block
   * is being reimplemented in JavaScript that belongs in CSS.
   */
  it('stays under the ceiling with every feature emitted', () => {
    const all = features(
      'reveal',
      'pointer',
      'sticky',
      'color-mode',
      'disclosure',
      'carousel',
      'menu',
    )
    const source =
      printScripts({ features: all, colorModeStorageKey: FIXTURE_COLOR_MODE_KEY }) ?? ''

    expect(Buffer.byteLength(source, 'utf8')).toBeLessThan(5 * 1024)
  })
})
