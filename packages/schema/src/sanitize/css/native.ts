import type { CssFeature } from './css.types'

/**
 * Layers 3 and 4 — PLAYGROUND.md § Parsing and validation. The browser is the authority on whether a
 * value is valid and it answers for free, so there is no CSS value grammar in this repository.
 *
 * This is the only DOM-dependent module in the validator, which is what lets the other four layers run
 * in the `node` process the schema tests live in.
 */
export interface NativeSupport {
  readonly ok: boolean
  /** ADR-268: `CSS.supports` was not there to ask. Validity is unknown, not refused. */
  readonly unverified: boolean
}

const UNVERIFIED: NativeSupport = { ok: true, unverified: true }

export function supportsDeclaration(property: string, value: string): NativeSupport {
  const api = typeof CSS === 'undefined' ? undefined : CSS

  if (api === undefined || typeof api.supports !== 'function') {
    return UNVERIFIED
  }

  try {
    return { ok: api.supports(property, value), unverified: false }
  } catch {
    // `CSS.supports` does not throw for bad input — it returns false. Something that does is a host
    // whose API is not the one this function knows, and an unknown answer is `unverified` by
    // definition. Swallowing it here is what keeps the contract that this never throws.
    return UNVERIFIED
  }
}

interface FeatureRule extends CssFeature {
  /** Matched against the value, or against the property name when the property is the feature. */
  readonly pattern: RegExp
  readonly on: 'value' | 'property'
}

/**
 * Small on purpose. The note is here to answer "will this ship" for the constructs a reader of the
 * playground is actually reaching for; a full compatibility database is a different product.
 */
const FEATURES: readonly FeatureRule[] = [
  {
    id: 'oklch',
    label: 'oklch()',
    support: 'Safari 15.4+, Chrome 111+',
    pattern: /\boklch\s*\(/i,
    on: 'value',
  },
  {
    id: 'oklab',
    label: 'oklab()',
    support: 'Safari 15.4+, Chrome 111+',
    pattern: /\boklab\s*\(/i,
    on: 'value',
  },
  {
    id: 'color-mix',
    label: 'color-mix()',
    support: 'Chrome 111+, Safari 16.2+',
    pattern: /\bcolor-mix\s*\(/i,
    on: 'value',
  },
  {
    id: 'color-function',
    label: 'color()',
    support: 'Safari 15+, Chrome 111+',
    pattern: /(^|[\s,(])color\s*\(/i,
    on: 'value',
  },
  {
    id: 'light-dark',
    label: 'light-dark()',
    support: 'Chrome 123+, Safari 17.5+',
    pattern: /\blight-dark\s*\(/i,
    on: 'value',
  },
  {
    id: 'container-units',
    label: 'container query units',
    support: 'Chrome 105+, Safari 16+',
    pattern: /\d\s*cq[whibmax]+\b/i,
    on: 'value',
  },
  {
    id: 'backdrop-filter',
    label: 'backdrop-filter',
    support: 'Chrome 76+, Safari 18+ unprefixed',
    pattern: /^backdrop-filter$/,
    on: 'property',
  },
  {
    id: 'clip-path',
    label: 'clip-path',
    support: 'Chrome 55+, Safari 13.1+',
    pattern: /^clip-path$/,
    on: 'property',
  },
  {
    id: 'mask-image',
    label: 'mask-image',
    support: 'Chrome 120+ unprefixed, Safari 15.4+',
    pattern: /^mask-image$/,
    on: 'property',
  },
]

const note = ({ id, label, support }: FeatureRule): CssFeature => ({ id, label, support })

export function detectFeatures(property: string, value: string): readonly CssFeature[] {
  return FEATURES.filter((feature) =>
    feature.pattern.test(feature.on === 'property' ? property : value),
  ).map(note)
}

/**
 * Which construct to blame when `CSS.supports` refuses the value. Only a value-level feature can be
 * the reason: a property-level note says the property is recent, and the browser that rejected the
 * declaration was asked about the value.
 */
export function blameFeature(value: string): CssFeature | undefined {
  const rule = FEATURES.find((feature) => feature.on === 'value' && feature.pattern.test(value))

  return rule === undefined ? undefined : note(rule)
}
