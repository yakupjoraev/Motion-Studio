import { BLOCKED_PROPERTIES, findBlockedConstructs } from './blocklist'
import type { CssError, CssFeature, CssLayer, CssValidation, Position } from './css.types'
import { blameFeature, detectFeatures, supportsDeclaration } from './native'
import { normalizeCssValue } from './normalize'
import {
  MAX_VALUE_LENGTH,
  type RawDeclaration,
  findStructuralErrors,
  positionAt,
  splitDeclarations,
} from './structural'

/**
 * **The only CSS validator in the codebase.** The security path — `sanitizeDocument` on a `.motion`
 * import — and the interactive paths — the inspector's `css` control, the playground — must never be
 * able to disagree about what is allowed, so there is one implementation and no app-level copy.
 *
 * Two entries, one per input shape (ADR-265): a value under a known property, and a declaration list.
 * The second is the first in a loop; it adds a split and an offset and no rules of its own.
 *
 * Neither throws. Parsing user input is an expected failure — CODE_STANDARDS.md § Errors — so both
 * return the union rather than raising.
 */
const at = (message: string, position: Position, layer: CssLayer): CssError => ({
  message,
  ...position,
  severity: 'error',
  layer,
})

const START: Position = { line: 1, column: 1 }

/** Kebab-case, or a custom property, which keeps its case because a custom property is case-sensitive. */
const PROPERTY_RE = /^(?:--[A-Za-z0-9_-]{1,48}|[a-z][a-z0-9-]{0,48})$/

const tooLong = (input: string): CssError =>
  at(
    `Too long: ${input.length} characters, cap is ${MAX_VALUE_LENGTH}.`,
    positionAt(input, MAX_VALUE_LENGTH),
    'structural',
  )

export function validateCssValue(property: string, input: string): CssValidation {
  if (input.trim() === '') {
    return { ok: false, errors: [at('Write a value to see it applied.', START, 'structural')] }
  }

  const structural = findStructuralErrors(input)

  if (structural.length > 0) {
    return { ok: false, errors: structural }
  }

  const blocked = findBlockedConstructs(input)

  if (blocked.length > 0) {
    return { ok: false, errors: blocked }
  }

  const normalized = normalizeCssValue(input)
  const features = detectFeatures(property, normalized)
  const support = supportsDeclaration(property, normalized)

  if (support.ok) {
    return { ok: true, normalized, features, unverified: support.unverified }
  }

  /*
   * The browser said no. When the value reaches for something recent, saying which construct and where
   * it landed is the answer the reader needs; blaming the value would send them looking for a typo
   * that is not there.
   */
  const blame = blameFeature(normalized)

  return {
    ok: false,
    errors: [
      blame === undefined
        ? at(`This browser does not accept this as a ${property} value.`, START, 'native')
        : at(`This browser does not support ${blame.label} — ${blame.support}.`, START, 'feature'),
    ],
  }
}

export interface DeclarationOptions {
  /** COMPONENT_LIBRARY.md § Control kinds: the `css` control's `properties` allow-list. */
  readonly properties?: readonly string[] | undefined
}

function propertyError(
  declaration: RawDeclaration,
  allowed: readonly string[] | undefined,
): CssError | undefined {
  const { property, position } = declaration

  // Before the shape check, so the two vectors are reported as what they are rather than as a
  // malformed name — `-moz-binding` fails both, and only one of the two answers is useful.
  if (BLOCKED_PROPERTIES.has(property)) {
    return at(`${property} is not allowed: it binds a script.`, position, 'blocklist')
  }

  if (!PROPERTY_RE.test(property)) {
    return at(
      `${JSON.stringify(property)} is not a CSS property name: lowercase, kebab-case.`,
      position,
      'structural',
    )
  }

  if (allowed !== undefined && !allowed.includes(property)) {
    return at(`${property} is not editable here.`, position, 'structural')
  }

  return undefined
}

/** An error inside a value is reported where the caller wrote it, not where the value started. */
const offset = (error: CssError, position: Position): CssError => ({
  ...error,
  line: position.line + error.line - 1,
  column: error.line === 1 ? position.column + error.column - 1 : error.column,
})

const unique = (features: readonly CssFeature[]): readonly CssFeature[] =>
  features.filter((feature, index) => features.findIndex((f) => f.id === feature.id) === index)

export function validateCssDeclarations(
  input: string,
  options: DeclarationOptions = {},
): CssValidation {
  if (input.length > MAX_VALUE_LENGTH) {
    return { ok: false, errors: [tooLong(input)] }
  }

  // An empty escape hatch is not a mistake, it is an unused one.
  if (input.trim() === '') {
    return { ok: true, normalized: '', features: [], unverified: false }
  }

  const split = splitDeclarations(input)
  const errors: CssError[] = [...split.errors]
  const features: CssFeature[] = []
  const normalized: string[] = []
  let unverified = false

  for (const declaration of split.declarations) {
    const rejected = propertyError(declaration, options.properties)

    if (rejected !== undefined) {
      errors.push(rejected)
      continue
    }

    const result = validateCssValue(declaration.property, declaration.value)

    if (!result.ok) {
      errors.push(...result.errors.map((error) => offset(error, declaration.valuePosition)))
      continue
    }

    features.push(...result.features)
    unverified = unverified || result.unverified
    normalized.push(`${declaration.property}: ${result.normalized}`)
  }

  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, normalized: normalized.join(';\n'), features: unique(features), unverified }
}
