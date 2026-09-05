import { guessLocale } from './guess-locale'
import { splitLocalePath } from './locale-href'
import { type Locale, isLocale } from './locales'

export interface RequestLocaleInput {
  readonly pathname: string
  readonly cookieLocale: Locale | undefined
  readonly country: string | null | undefined
  readonly acceptLanguage: string | null | undefined
}

export type RequestLocaleAction =
  /** The path already names a locale: serve it. */
  | { readonly kind: 'pass'; readonly locale: Locale }
  /** English on an unprefixed path: serve `/en/...` without changing the URL (ADR-361). */
  | { readonly kind: 'rewrite'; readonly locale: Locale; readonly to: string }
  /** The visitor belongs on another URL — a stored Russian choice, a guess, or a stray `/en/`. */
  | { readonly kind: 'redirect'; readonly locale: Locale; readonly to: string }

const withSearch = (path: string, search: string): string => `${path}${search}`

/** `/` under a prefix is `/ru`, not `/ru/` — a trailing slash is a second URL for one page. */
const prefixed = (locale: Locale, pathname: string): string =>
  pathname === '/' ? `/${locale}` : `/${locale}${pathname}`

/**
 * The whole locale decision, as a pure function of the request, so the four behaviours the owner
 * specified are unit-testable without a server:
 *
 * 1. a first-time visitor gets the language their region suggests,
 * 2. an explicit choice always wins,
 * 3. the choice survives a return visit — the guess runs **only** when no choice is stored,
 * 4. (the switch itself lives in the header, which is not this function's business).
 */
export function resolveRequestLocale(
  { pathname, cookieLocale, country, acceptLanguage }: RequestLocaleInput,
  search = '',
): RequestLocaleAction {
  const [, first] = pathname.split('/')

  // `/en/...` is not a URL this product has (ADR-361): one page, one address.
  if (first === 'en') {
    const { path } = splitLocalePath(pathname)

    return { kind: 'redirect', locale: 'en', to: withSearch(path, search) }
  }

  if (isLocale(first)) {
    return { kind: 'pass', locale: first }
  }

  const chosen = cookieLocale ?? guessLocale({ country, acceptLanguage })

  if (chosen === 'en') {
    return { kind: 'rewrite', locale: 'en', to: withSearch(prefixed('en', pathname), search) }
  }

  return { kind: 'redirect', locale: chosen, to: withSearch(prefixed(chosen, pathname), search) }
}
