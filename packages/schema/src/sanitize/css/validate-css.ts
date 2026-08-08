import { type Result, err, ok } from '@motion-studio/utils'

import { findBlockedConstructs } from './blocklist'
import { normalizeCssValue } from './normalize'
import { findStructuralIssues } from './structural'

/**
 * **The only CSS validator in the codebase.** The security path (importing a `.motion` file) and the
 * interactive path (the playground, the inspector's `css` control) must never be able to disagree
 * about what is allowed, so there is one implementation and no app-level copy.
 *
 * Three of the five layers live here — structural, blocklist, normalize — and they are the three that
 * need no DOM, which is what lets this module run in the same `node` process as the rest of the
 * schema. Prompt 48 adds the two DOM-dependent layers (property support and computed-value round
 * trip) to this same module and wires the playground to it.
 */
export interface CssRejection {
  readonly layer: 'structural' | 'blocklist'
  readonly id: string
  readonly message: string
}

export interface CssDeclaration {
  readonly property: string
  readonly value: string
}

/** Kebab-case, no vendor `-`-prefixed script hooks, and short enough to be a real property name. */
const PROPERTY_RE = /^[a-z][a-z0-9-]{0,48}$/

export function validateCssValue(value: string): Result<string, readonly CssRejection[]> {
  const structural = findStructuralIssues(value).map(
    (issue): CssRejection => ({ layer: 'structural', id: issue.kind, message: issue.message }),
  )

  if (structural.length > 0) {
    return err(structural)
  }

  const blocked = findBlockedConstructs(value).map(
    (hit): CssRejection => ({ layer: 'blocklist', id: hit.id, message: hit.reason }),
  )

  if (blocked.length > 0) {
    return err(blocked)
  }

  return ok(normalizeCssValue(value))
}

export function validateCssDeclaration(
  property: string,
  value: string,
): Result<CssDeclaration, readonly CssRejection[]> {
  if (!PROPERTY_RE.test(property)) {
    return err([
      {
        layer: 'structural',
        id: 'property',
        message: `${JSON.stringify(property)} is not a CSS property name`,
      },
    ])
  }

  const validated = validateCssValue(value)

  return validated.ok ? ok({ property, value: validated.value }) : validated
}
