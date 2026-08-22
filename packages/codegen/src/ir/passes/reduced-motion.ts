import type { IRRule, IRValue } from '../ir.types'

/**
 * ANIMATION_SYSTEM.md § Reduced motion, applied to the export: "The export honours reduced motion or it
 * is not shipping our animation." Unconditional — there is no option that turns this off, because an
 * export without it is an export that ignores an operating-system accessibility setting.
 *
 * The shape is the one EXPORT_ENGINE.md § React prints: one `useReducedMotion()` call, the initial
 * variant flipped to the visible one, and the transition collapsed to zero duration.
 */
export const REDUCED_HOOK = 'const shouldReduceMotion = useReducedMotion()'

export const REDUCED_FLAG = 'shouldReduceMotion'

/** `'"hidden"'` from a fragment is a JSX attribute value, not an expression. */
export function toValue(raw: string): IRValue {
  if (raw.startsWith('{') && raw.endsWith('}')) {
    return { kind: 'expression', code: raw.slice(1, -1) }
  }

  if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
    return { kind: 'literal', value: raw.slice(1, -1) }
  }

  return { kind: 'literal', value: raw }
}

const asCode = (value: IRValue): string => {
  switch (value.kind) {
    case 'literal':
      return typeof value.value === 'string' ? `'${value.value}'` : String(value.value)
    case 'expression':
      return value.code
    case 'reference':
      return value.name
  }
}

/**
 * The variant the element animates *to*, which is the one a reduced-motion user starts on. Read off
 * the fragment rather than assumed: an entrance preset names it in `whileInView` or `animate`, and a
 * preset that names it in neither has nothing to flip.
 */
function visibleVariant(attributes: Readonly<Record<string, IRValue>>): IRValue | undefined {
  return attributes['whileInView'] ?? attributes['animate']
}

/** Motion-engine attributes, rewritten so the same element serves both preferences. */
export function withReducedMotion(
  attributes: Readonly<Record<string, IRValue>>,
): Readonly<Record<string, IRValue>> {
  const next: Record<string, IRValue> = { ...attributes }
  const visible = visibleVariant(attributes)
  const initial = attributes['initial']

  if (visible !== undefined && initial !== undefined) {
    next['initial'] = {
      kind: 'expression',
      code: `${REDUCED_FLAG} ? ${asCode(visible)} : ${asCode(initial)}`,
    }
  }

  const transition = attributes['transition']

  if (transition !== undefined) {
    next['transition'] = {
      kind: 'expression',
      code: `${REDUCED_FLAG} ? { duration: 0 } : ${asCode(transition)}`,
    }
  }

  return next
}

/**
 * The CSS-engine half. A class-driven animation cannot branch on a hook, so the stylesheet carries the
 * media query instead — `animation` and `transition` both, because a preset may drive either.
 */
export function reducedMotionRules(classNames: readonly string[]): readonly IRRule[] {
  return classNames.map((className) => ({
    selector: `.${className}`,
    declarations: ['animation: none', 'transition: none'],
    media: '(prefers-reduced-motion: reduce)',
  }))
}
