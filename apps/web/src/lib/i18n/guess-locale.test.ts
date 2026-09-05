import { describe, expect, it } from 'vitest'

import { firstLanguageTag, guessLocale } from './guess-locale'

describe('firstLanguageTag', () => {
  it.each([
    ['ru-RU,ru;q=0.9,en;q=0.8', 'ru-ru'],
    ['en-GB', 'en-gb'],
    ['  RU ', 'ru'],
    ['', undefined],
    [null, undefined],
    [undefined, undefined],
  ])('%s → %s', (header, tag) => {
    expect(firstLanguageTag(header)).toBe(tag)
  })
})

describe('guessLocale', () => {
  it.each(['RU', 'BY', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'AM', 'MD'])(
    'answers Russian for %s whatever the browser asks for',
    (country) => {
      expect(guessLocale({ country, acceptLanguage: 'en-US,en;q=0.9' })).toBe('ru')
    },
  )

  it('answers Russian for a Russian browser outside the region', () => {
    expect(guessLocale({ country: 'PT', acceptLanguage: 'ru,en;q=0.7' })).toBe('ru')
  })

  it('answers English when neither signal points at Russian', () => {
    expect(guessLocale({ country: 'US', acceptLanguage: 'en-US,en;q=0.9' })).toBe('en')
  })

  it('answers English when there is no signal at all', () => {
    expect(guessLocale({ country: null, acceptLanguage: null })).toBe('en')
  })

  it('reads a lower-case country header', () => {
    expect(guessLocale({ country: 'ru', acceptLanguage: null })).toBe('ru')
  })
})
