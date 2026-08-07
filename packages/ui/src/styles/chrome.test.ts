import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * `chrome.css` carries decisions no component test can see, because jsdom loads no stylesheets: the control
 * transitions (ADR-033) and the overlay animations Radix keys its unmount on. This asserts the properties of
 * that file that would silently break the chrome if they drifted.
 *
 * Read from disk rather than imported. Vitest resolves a `?raw` CSS import to an empty string under
 * `css: false`, and `fileURLToPath` rejects a `URL` built from jsdom's global constructor — it is not
 * Node's. Passing the string through is the form that works in both environments.
 */
const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'chrome.css'), 'utf8')

/** Everything outside comments — the rules that actually reach a browser. */
const RULES = CSS.replaceAll(/\/\*[\s\S]*?\*\//g, '')

const blockOf = (selector: string): string => {
  const match = RULES.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))

  if (match?.[1] === undefined) {
    throw new Error(`chrome.css declares no rule for ${selector}`)
  }

  return match[1]
}

describe('chrome.css', () => {
  it('declares exactly one transition per control class', () => {
    /*
     * The whole point of ADR-033: an element may have one `transition-property`, so a second declaration in
     * the same block silently discards the first — the defect this file was written to end.
     */
    for (const selector of ['.ms-transition-control', '.ms-transition-travel']) {
      expect(blockOf(selector).match(/transition\s*:/g), selector).toHaveLength(1)
    }
  })

  it.each(['color', 'background-color', 'border-color', 'box-shadow', 'transform'])(
    'animates %s on both control classes',
    (property) => {
      expect(blockOf('.ms-transition-control')).toContain(`${property} var(--ms-duration`)
      expect(blockOf('.ms-transition-travel')).toContain(`${property} var(--ms-duration`)
    },
  )

  it('eases a press on accelerate and a travel on standard', () => {
    // § Timing splits the two, and a CSS shorthand is the only form that can carry both on one element.
    expect(blockOf('.ms-transition-control')).toContain(
      'transform var(--ms-duration-fast) var(--ms-ease-accelerate)',
    )
    expect(blockOf('.ms-transition-travel')).toContain(
      'transform var(--ms-duration-fast) var(--ms-ease-standard)',
    )
  })

  it('takes every duration from a token, which is what makes reduced motion automatic', () => {
    /*
     * ADR-021: `--ms-duration-*` carries the theme's `motionScale` and the environment's reduced-motion
     * factor both. A literal `120ms` anywhere in this file is a rule that ignores a user who asked for
     * less motion, so any bare millisecond value fails.
     */
    expect(RULES).not.toMatch(/\d+m?s\b/)
    expect(RULES).toContain('var(--ms-duration-fast)')
  })

  it('takes every easing from a token too', () => {
    const easings = RULES.match(/(?:cubic-bezier|ease-in|ease-out|linear)\b/g) ?? []

    expect(easings).toHaveLength(0)
  })

  it('animates rather than transitions the overlays, because Radix unmounts on an animation', () => {
    // A transition on `[data-state=closed]` would make every popover exit instant — the content is gone
    // before the fade starts. Radix looks for a running CSS animation and nothing else.
    for (const state of ['open', 'closed']) {
      expect(RULES).toMatch(new RegExp(`\\[data-ms-overlay\\]\\[data-state='${state}'\\]`))
    }
    expect(RULES.match(/animation:/g)).not.toBeNull()
  })

  it('gives the dialog the one longer entrance § Timing allows', () => {
    expect(RULES).toContain("[data-ms-overlay='dialog'][data-state='open']")
    expect(RULES).toContain('var(--ms-duration-base) var(--ms-ease-emphasized)')
  })
})
