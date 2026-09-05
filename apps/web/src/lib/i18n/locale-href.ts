import { DEFAULT_LOCALE, type Locale, isLocale } from './locales'

/**
 * ADR-361: English is the root, Russian is a prefix. Every internal link is built here, so the rule
 * lives in one function rather than in each `href`.
 *
 * `path` is always the unprefixed route — `/studio`, `/blocks/hero-split`, `/`.
 */
export function localeHref(locale: Locale, path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`

  if (locale === DEFAULT_LOCALE) {
    return normalised
  }

  return normalised === '/' ? `/${locale}` : `/${locale}${normalised}`
}

export interface SplitPath {
  readonly locale: Locale
  /** The route without its locale prefix, always starting with `/`. */
  readonly path: string
}

/** `/ru/blocks/hero-split` → `{ locale: 'ru', path: '/blocks/hero-split' }`. */
export function splitLocalePath(pathname: string): SplitPath {
  const [, first, ...rest] = pathname.split('/')

  if (!isLocale(first)) {
    return { locale: DEFAULT_LOCALE, path: pathname === '' ? '/' : pathname }
  }

  const remainder = rest.join('/')

  return { locale: first, path: remainder === '' ? '/' : `/${remainder}` }
}

/** The same page in the other language — what the switch in the header links to. */
export const switchLocaleHref = (pathname: string, target: Locale): string =>
  localeHref(target, splitLocalePath(pathname).path)
