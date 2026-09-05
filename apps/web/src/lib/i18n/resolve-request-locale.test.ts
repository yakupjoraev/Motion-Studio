import { describe, expect, it } from 'vitest'

import { resolveRequestLocale } from './resolve-request-locale'

const RUSSIAN_BROWSER = 'ru-RU,ru;q=0.9,en-US;q=0.8'
const ENGLISH_BROWSER = 'en-GB,en;q=0.9'

describe('resolveRequestLocale — behaviour 1: the region suggests the language', () => {
  it('sends a first-time visitor from Russia to the Russian prefix', () => {
    expect(
      resolveRequestLocale({
        pathname: '/',
        cookieLocale: undefined,
        country: 'RU',
        acceptLanguage: ENGLISH_BROWSER,
      }),
    ).toEqual({ kind: 'redirect', locale: 'ru', to: '/ru' })
  })

  it('reads the region through the browser when the deployment has no geo header', () => {
    expect(
      resolveRequestLocale({
        pathname: '/blocks',
        cookieLocale: undefined,
        country: null,
        acceptLanguage: RUSSIAN_BROWSER,
      }),
    ).toEqual({ kind: 'redirect', locale: 'ru', to: '/ru/blocks' })
  })

  it('leaves an English visitor on the unprefixed URL', () => {
    expect(
      resolveRequestLocale({
        pathname: '/studio',
        cookieLocale: undefined,
        country: 'DE',
        acceptLanguage: ENGLISH_BROWSER,
      }),
    ).toEqual({ kind: 'rewrite', locale: 'en', to: '/en/studio' })
  })
})

describe('resolveRequestLocale — behaviour 2: an explicit choice always wins', () => {
  it('serves English inside a Russian-speaking country when English was chosen', () => {
    expect(
      resolveRequestLocale({
        pathname: '/',
        cookieLocale: 'en',
        country: 'RU',
        acceptLanguage: RUSSIAN_BROWSER,
      }),
    ).toEqual({ kind: 'rewrite', locale: 'en', to: '/en' })
  })

  it('serves Russian outside the region when Russian was chosen', () => {
    expect(
      resolveRequestLocale({
        pathname: '/playground',
        cookieLocale: 'ru',
        country: 'US',
        acceptLanguage: ENGLISH_BROWSER,
      }),
    ).toEqual({ kind: 'redirect', locale: 'ru', to: '/ru/playground' })
  })
})

describe('resolveRequestLocale — behaviour 3: the choice survives the return visit', () => {
  /*
   * The defect this whole file exists for: a guess that runs on every request silently undoes the
   * choice on the next visit. The stored value is read first and the signals are not consulted.
   */
  it('does not re-run the guess when a choice is stored', () => {
    const returning = resolveRequestLocale({
      pathname: '/',
      cookieLocale: 'en',
      country: 'RU',
      acceptLanguage: RUSSIAN_BROWSER,
    })

    expect(returning.locale).toBe('en')
  })
})

describe('resolveRequestLocale — one page, one URL', () => {
  it.each([
    ['/en', '/'],
    ['/en/blocks', '/blocks'],
    ['/en/blocks/hero-split', '/blocks/hero-split'],
  ])('redirects %s to %s', (pathname, to) => {
    expect(
      resolveRequestLocale({
        pathname,
        cookieLocale: 'ru',
        country: 'RU',
        acceptLanguage: RUSSIAN_BROWSER,
      }),
    ).toEqual({ kind: 'redirect', locale: 'en', to })
  })

  it('serves a Russian path as it stands, whatever the signals say', () => {
    expect(
      resolveRequestLocale({
        pathname: '/ru/docs',
        cookieLocale: 'en',
        country: 'US',
        acceptLanguage: ENGLISH_BROWSER,
      }),
    ).toEqual({ kind: 'pass', locale: 'ru' })
  })

  it('carries the query string through a redirect', () => {
    expect(
      resolveRequestLocale(
        {
          pathname: '/studio',
          cookieLocale: 'ru',
          country: null,
          acceptLanguage: null,
        },
        '?fixture=pricing',
      ),
    ).toEqual({ kind: 'redirect', locale: 'ru', to: '/ru/studio?fixture=pricing' })
  })
})
