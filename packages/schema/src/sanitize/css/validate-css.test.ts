import { afterEach, describe, expect, it, vi } from 'vitest'

import * as barrel from '../../index'

import {
  MALICIOUS_CSS,
  MALICIOUS_DECLARATIONS,
  SAFE_CSS,
  SAFE_DECLARATIONS,
} from './__fixtures__/malicious'
import { VALID_CSS } from './__fixtures__/valid'
import { validateCssDeclarations, validateCssValue } from './validate-css'

afterEach(() => {
  vi.unstubAllGlobals()
})

const errorsOf = (property: string, value: string) => {
  const result = validateCssValue(property, value)

  return result.ok ? [] : result.errors
}

describe('the valid fixtures', () => {
  it('has values for all eight sandbox properties, and more than fifty of them', () => {
    expect(VALID_CSS.length).toBeGreaterThanOrEqual(50)
    expect(new Set(VALID_CSS.map((entry) => entry.property)).size).toBeGreaterThanOrEqual(8)
  })

  it.each(VALID_CSS)('accepts $property: $value', ({ property, value }) => {
    expect(validateCssValue(property, value).ok).toBe(true)
  })

  it('reports that layer 3 did not run where there is no browser — ADR-268', () => {
    const result = validateCssValue('color', 'red')

    expect(result.ok && result.unverified).toBe(true)
  })
})

describe('the malicious fixtures', () => {
  it.each([
    ['urlRemote', 'blocklist'],
    ['urlSpaced', 'blocklist'],
    ['urlJavascript', 'blocklist'],
    ['urlDataHtml', 'blocklist'],
    ['urlDataSvg', 'blocklist'],
    ['import', 'blocklist'],
    ['expression', 'blocklist'],
    ['element', 'blocklist'],
    ['comment', 'structural'],
    ['escape', 'structural'],
    ['unbalancedParen', 'structural'],
    ['strayParen', 'structural'],
    ['unbalancedBracket', 'structural'],
    ['unterminatedString', 'structural'],
    ['semicolon', 'structural'],
    ['brace', 'structural'],
    ['tooLong', 'structural'],
  ] as const)('refuses %s at the %s layer', (key, layer) => {
    const errors = errorsOf('background', MALICIOUS_CSS[key])

    expect(errors[0]?.layer).toBe(layer)
    expect(errors[0]?.message.length).toBeGreaterThan(10)
  })

  it('allows the one url() exception', () => {
    expect(validateCssValue('mask-image', SAFE_CSS.dataImage).ok).toBe(true)
  })

  it('refuses an empty value with something a reader can act on', () => {
    expect(errorsOf('background', '   ')[0]?.message).toContain('Write a value')
  })
})

describe('layer 3, with a browser to ask', () => {
  it('refuses a value the browser refuses', () => {
    vi.stubGlobal('CSS', { supports: () => false })

    const errors = errorsOf('box-shadow', 'banana')

    expect(errors[0]).toMatchObject({ layer: 'native' })
    expect(errors[0]?.message).toContain('box-shadow')
  })

  it('blames the modern construct when the value reaches for one', () => {
    vi.stubGlobal('CSS', { supports: () => false })

    const errors = errorsOf('background', 'oklch(62% 0.19 285)')

    expect(errors[0]).toMatchObject({ layer: 'feature' })
    expect(errors[0]?.message).toContain('Safari 15.4+')
  })

  it('marks a checked value as verified', () => {
    vi.stubGlobal('CSS', { supports: () => true })

    const result = validateCssValue('background', 'red')

    expect(result.ok && result.unverified).toBe(false)
  })
})

describe('layer 4, the compatibility note', () => {
  it('surfaces the constructs the value used', () => {
    const result = validateCssValue(
      'backdrop-filter',
      'color-mix(in oklab, oklch(62% 0.19 285), white)',
    )
    const ids = result.ok ? result.features.map((feature) => feature.id) : []

    expect(ids).toEqual(expect.arrayContaining(['color-mix', 'oklch', 'backdrop-filter']))
  })

  it('says nothing about a value that uses nothing recent', () => {
    const result = validateCssValue('background', 'red')

    expect(result.ok && result.features).toEqual([])
  })
})

describe('layer 5 is idempotent', () => {
  it.each(VALID_CSS)(
    '$property: $value survives a second pass unchanged',
    ({ property, value }) => {
      const once = validateCssValue(property, value)
      const normalized = once.ok ? once.normalized : ''
      const twice = validateCssValue(property, normalized)

      expect(twice.ok && twice.normalized).toBe(normalized)
    },
  )
})

/** A deterministic generator: TESTING.md § Determinism. A fuzz failure has to be reproducible. */
function* fuzz(count: number): Generator<string> {
  const alphabet =
    '()[]{}\'"\\;:,/*-_ \n\turl(data:image/png;base64,ABC@importexpression#%.0189abcxyz'
  let seed = 0x5eed

  for (let iteration = 0; iteration < count; iteration += 1) {
    let value = ''

    seed = (seed * 1103515245 + 12345) % 2147483648
    const length = seed % 120

    for (let index = 0; index < length; index += 1) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      value += alphabet[seed % alphabet.length]
    }

    yield value
  }
}

describe('it never throws', () => {
  it.each(Object.entries(MALICIOUS_CSS))('over the %s payload', (_label, value) => {
    expect(() => validateCssValue('background', value)).not.toThrow()
    expect(() => validateCssDeclarations(value)).not.toThrow()
  })

  it('over a thousand fuzzed strings', () => {
    let checked = 0

    for (const value of fuzz(1000)) {
      const result = validateCssValue('background', value)

      expect(typeof result.ok).toBe('boolean')
      expect(() => validateCssDeclarations(value)).not.toThrow()
      checked += 1
    }

    expect(checked).toBe(1000)
  })
})

describe('declaration lists — ADR-265', () => {
  it.each(Object.entries(SAFE_DECLARATIONS))('accepts the %s fixture', (_label, input) => {
    expect(validateCssDeclarations(input).ok).toBe(true)
  })

  it.each(Object.entries(MALICIOUS_DECLARATIONS))('refuses the %s payload', (_label, input) => {
    expect(validateCssDeclarations(input).ok).toBe(false)
  })

  it('re-serialises the list in one spelling', () => {
    const result = validateCssDeclarations('COLOR:red;;\n  opacity:  0.5;')

    expect(result.ok).toBe(false)
    expect(validateCssDeclarations('color:red;;\n  opacity:  0.5;')).toMatchObject({
      ok: true,
      normalized: 'color: red;\nopacity: 0.5',
    })
  })

  it('treats an unused escape hatch as unused, not as a mistake', () => {
    expect(validateCssDeclarations('   ')).toMatchObject({ ok: true, normalized: '' })
  })

  it('holds the caller to the properties it allowed', () => {
    const result = validateCssDeclarations('color: red', { properties: ['opacity'] })

    expect(result.ok ? '' : result.errors[0]?.message).toBe('color is not editable here.')
  })

  it.each([
    ['behavior', MALICIOUS_DECLARATIONS.behavior],
    ['-moz-binding', MALICIOUS_DECLARATIONS.mozBinding],
  ])('refuses %s, the property that is the vector itself', (_label, input) => {
    const result = validateCssDeclarations(input)

    expect(result.ok ? '' : result.errors[0]?.layer).toBe('blocklist')
  })

  it('points at the colon of a declaration whose predecessor never ended', () => {
    const result = validateCssDeclarations('color: red\nopacity: 0.5')
    const error = result.ok ? undefined : result.errors[0]

    expect(error?.message).toContain("end the declaration before it with ';'")
    expect(error).toMatchObject({ line: 2, column: 8 })
  })

  it('reports an error where the caller wrote it, not where the value started', () => {
    const result = validateCssDeclarations('color: red;\nbackground: rgb(0, 0, 0')
    const error = result.ok ? undefined : result.errors[0]

    expect(error).toMatchObject({ line: 2, column: 16 })
  })

  it('merges the compatibility notes of every declaration, once each', () => {
    const result = validateCssDeclarations('color: oklch(62% 0.19 285);\nfill: oklch(50% 0.1 20)')

    expect(result.ok && result.features.map((feature) => feature.id)).toEqual(['oklch'])
  })

  it('caps the whole list, not each declaration', () => {
    expect(validateCssDeclarations(MALICIOUS_DECLARATIONS.tooLong).ok).toBe(false)
  })
})

describe('one validator', () => {
  it('is the one the package exports', () => {
    expect(barrel.validateCssValue).toBe(validateCssValue)
    expect(barrel.validateCssDeclarations).toBe(validateCssDeclarations)
  })
})
