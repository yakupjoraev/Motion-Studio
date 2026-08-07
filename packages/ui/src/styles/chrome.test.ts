import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * jsdom loads no stylesheets, so nothing else covers this file. Read from disk rather than imported: Vitest
 * resolves a `?raw` CSS import to an empty string, and `fileURLToPath` rejects jsdom's `URL`.
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
    // ADR-033: a second declaration in the same block silently discards the first.
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
    // ADR-021: a literal `120ms` here is a rule that ignores a user who asked for less motion.
    expect(RULES).not.toMatch(/\d+m?s\b/)
    expect(RULES).toContain('var(--ms-duration-fast)')
  })

  it('takes every easing from a token too', () => {
    const easings = RULES.match(/(?:cubic-bezier|ease-in|ease-out|linear)\b/g) ?? []

    expect(easings).toHaveLength(0)
  })

  it('animates rather than transitions the overlays, because Radix unmounts on an animation', () => {
    // A transition on `[data-state=closed]` makes every exit instant: the content is gone before the fade.
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
