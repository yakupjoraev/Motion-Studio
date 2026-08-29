/**
 * The validator's own entry point, published as `@motion-studio/schema/css`.
 *
 * It exists for weight, not for taste: the package barrel pulls in the Zod document schemas, and a
 * page that only wants to check a CSS value should not carry a document parser to do it — ADR-273 has
 * the measurement. Everything here is also re-exported from the package barrel, so there is one public
 * API with two doors and no deep import.
 */
export {
  validateCssDeclarations,
  validateCssValue,
  type DeclarationOptions,
} from './validate-css'
export type { CssError, CssFeature, CssLayer, CssValidation, Position } from './css.types'
export { MAX_VALUE_LENGTH, findStructuralErrors } from './structural'
export {
  BLOCKED_PROPERTIES,
  CSS_BLOCKLIST,
  findBlockedConstructs,
  type BlocklistEntry,
} from './blocklist'
export { normalizeCssValue } from './normalize'
