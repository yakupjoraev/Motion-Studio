import { describe, expect, it } from 'vitest'

import { localeHref, splitLocalePath, switchLocaleHref } from './locale-href'

describe('localeHref', () => {
  it.each([
    ['en', '/', '/'],
    ['en', '/studio', '/studio'],
    ['ru', '/', '/ru'],
    ['ru', '/studio', '/ru/studio'],
    ['ru', '/blocks/hero-split', '/ru/blocks/hero-split'],
  ] as const)('%s + %s → %s', (locale, path, href) => {
    expect(localeHref(locale, path)).toBe(href)
  })
})

describe('splitLocalePath', () => {
  it.each([
    ['/', 'en', '/'],
    ['/studio', 'en', '/studio'],
    ['/ru', 'ru', '/'],
    ['/ru/studio', 'ru', '/studio'],
    ['/ru/blocks/hero-split', 'ru', '/blocks/hero-split'],
  ] as const)('%s → %s %s', (pathname, locale, path) => {
    expect(splitLocalePath(pathname)).toEqual({ locale, path })
  })

  it('does not mistake a route that begins with a locale-like segment', () => {
    expect(splitLocalePath('/rust')).toEqual({ locale: 'en', path: '/rust' })
  })
})

describe('switchLocaleHref', () => {
  it('keeps the reader on the page they are reading', () => {
    expect(switchLocaleHref('/blocks/hero-split', 'ru')).toBe('/ru/blocks/hero-split')
    expect(switchLocaleHref('/ru/blocks/hero-split', 'en')).toBe('/blocks/hero-split')
  })
})
