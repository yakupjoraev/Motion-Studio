import { describe, expect, it } from 'vitest'

import { MALICIOUS_CSS, SAFE_CSS } from './__fixtures__/malicious'
import { BLOCKED_PROPERTIES, CSS_BLOCKLIST, findBlockedConstructs } from './blocklist'

const messages = (value: string): string =>
  findBlockedConstructs(value)
    .map((error) => error.message)
    .join(' ')

describe('every entry stops the payload it was written for', () => {
  it.each([
    ['url', MALICIOUS_CSS.urlRemote],
    ['import', MALICIOUS_CSS.import],
    ['expression', MALICIOUS_CSS.expression],
    ['behavior', MALICIOUS_CSS.behavior],
    ['moz-binding', MALICIOUS_CSS.mozBinding],
    ['element', MALICIOUS_CSS.element],
  ])('%s', (id, value) => {
    const entry = CSS_BLOCKLIST.find((rule) => rule.id === id)
    const errors = findBlockedConstructs(value)

    expect(entry, `no rule with id ${id}`).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.every((error) => error.layer === 'blocklist')).toBe(true)
  })

  it('has a fixture for every rule, so a new rule cannot ship untested', () => {
    const covered = CSS_BLOCKLIST.filter((rule) =>
      Object.values(MALICIOUS_CSS).some(
        (value) => findBlockedConstructs(value).length > 0 && rule.pattern.test(value),
      ),
    )

    expect(covered).toHaveLength(CSS_BLOCKLIST.length)
  })
})

describe('the url() exception — ADR-266', () => {
  it('allows an inline data image, which the asset sanitizer can vouch for', () => {
    expect(findBlockedConstructs(SAFE_CSS.dataImage)).toEqual([])
  })

  it('allows an unquoted data image', () => {
    expect(findBlockedConstructs('url(data:image/png;base64,iVBORw0KGgo=)')).toEqual([])
  })

  it.each([
    ['a remote URL', MALICIOUS_CSS.urlRemote],
    ['a spaced call', MALICIOUS_CSS.urlSpaced],
    ['a javascript: URL', MALICIOUS_CSS.urlJavascript],
    ['an HTML data URL', MALICIOUS_CSS.urlDataHtml],
    ['an SVG data URL, which can carry a script', MALICIOUS_CSS.urlDataSvg],
  ])('refuses %s', (_label, value) => {
    expect(findBlockedConstructs(value).length).toBeGreaterThan(0)
  })

  it('says which url() and why', () => {
    const error = findBlockedConstructs(`red, ${MALICIOUS_CSS.urlRemote}`)[0]

    expect(error?.message).toContain('not a data URL')
    expect(error?.column).toBe(6)
  })

  it('checks every call, not only the first', () => {
    const value = `${SAFE_CSS.dataImage}, ${MALICIOUS_CSS.urlRemote}`

    expect(findBlockedConstructs(value)).toHaveLength(1)
  })
})

describe('blocked properties', () => {
  it('names the two that are the vector themselves', () => {
    expect([...BLOCKED_PROPERTIES].sort()).toEqual(['-moz-binding', 'behavior'])
  })
})

describe('what it leaves alone', () => {
  it.each(Object.entries(SAFE_CSS))('accepts the %s fixture', (_label, value) => {
    expect(findBlockedConstructs(value)).toEqual([])
  })

  it('does not confuse a scroll-behavior value with the behavior binding', () => {
    expect(messages('smooth')).toBe('')
  })
})
